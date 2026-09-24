"""Transcriptor Domus Salud. No iniciar sin activación, consentimiento y despacho de servidor."""
import asyncio
from datetime import datetime, timezone
import json
import logging
import os
import uuid
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import AgentServer, JobContext, cli, inference
from livekit.agents.stt import SpeechEventType

load_dotenv('.env.local')
log = logging.getLogger('domus-transcriptor')
server = AgentServer()


def config():
    url = os.environ.get('SUPABASE_URL', '').rstrip('/')
    key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
    if not url.startswith('https://') or not key:
        raise RuntimeError('Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY privados')
    return url, key


def query(method, endpoint, payload=None, params=None):
    """PostgREST/RPC desde el agente (nunca desde el navegador)."""
    url, key = config()
    path = endpoint + ('?' + urlencode(params) if params else '')
    body = json.dumps(payload).encode() if payload is not None else None
    req = Request(
        url + '/rest/v1/' + path,
        data=body,
        method=method,
        headers={
            'apikey': key,
            'Authorization': 'Bearer ' + key,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    )
    with urlopen(req, timeout=8) as res:
        raw = res.read()
        return json.loads(raw) if raw else None


def all_consented(meeting_id):
    # Esta función SQL existente exige autorización a TODOS los invitados.
    return query('POST', 'rpc/video_all_consented', {'p_meeting_id': meeting_id}) is True


def invited_member(meeting_id, identity):
    """Accept signed internal LiveKit UUIDs and guest identities bound to an active link."""
    if identity.startswith('guest:'):
        guests = query('GET', 'video_guest_entries', params={
            'select': 'identity,meeting_id,link_id', 'identity': 'eq.' + identity,
            'meeting_id': 'eq.' + meeting_id, 'limit': '1',
        })
        if not guests:
            return None
        links = query('GET', 'video_guest_links', params={
            'select': 'id', 'id': 'eq.' + guests[0]['link_id'],
            'meeting_id': 'eq.' + meeting_id, 'revoked_at': 'is.null',
            'expires_at': 'gt.' + datetime.now(timezone.utc).isoformat(), 'limit': '1',
        })
        if not links:
            return None
        member_id = identity
    else:
        try:
            identity = str(uuid.UUID(identity))
        except (TypeError, ValueError):
            return None
        members = query('GET', 'video_members', params={
            'select': 'id', 'auth_user_id': 'eq.' + identity,
            'active': 'eq.true', 'limit': '1',
        })
        if not members:
            return None
        member_id = members[0]['id']

    invitations = query('GET', 'video_meeting_participants', params={
        'select': 'member_id', 'meeting_id': 'eq.' + meeting_id,
        'member_id': 'eq.' + member_id, 'limit': '1',
    })
    return member_id if invitations else None


def save_segment(meeting_id, member_id, segment_id, content):
    """Atomic RPC: checks running dispatch, all consents and membership under meeting lock."""
    runs = query('GET', 'video_transcription_runs', params={
        'select': 'run_id,status', 'meeting_id': 'eq.' + meeting_id, 'limit': '1',
    })
    if not runs or runs[0]['status'] != 'active' or not all_consented(meeting_id):
        raise PermissionError('Transcripción detenida o consentimiento retirado')
    moment = datetime.now(timezone.utc).isoformat()
    saved = query('POST', 'rpc/video_transcription_write_segment', {
        'p_meeting_id': meeting_id,
        'p_run_id': runs[0]['run_id'],
        'p_member_id': member_id,
        'p_segment_key': segment_id,
        'p_content': content[:8000],
        'p_starts_at': moment,
        'p_ends_at': moment,
    })
    if saved is not True:
        raise PermissionError('Supabase no autorizó guardar este segmento')


def parse_meeting(room_name):
    if not room_name.startswith('domus-'):
        raise ValueError('Sala ajena a Domus Salud')
    meeting_id = str(uuid.UUID(room_name[6:]))
    if room_name != 'domus-' + meeting_id:
        raise ValueError('Formato de sala inválido')
    return meeting_id


@server.rtc_session(agent_name='domus-transcriptor')
async def transcriber(ctx: JobContext):
    # Activación explícita: la plantilla NO transcribe accidentalmente por desplegarse.
    if os.getenv('DOMUS_TRANSCRIPTION_ENABLED') != 'true':
        log.info('Transcripción deshabilitada; no se conecta a la sala')
        return

    try:
        meeting_id = parse_meeting(ctx.room.name)
        if not await asyncio.to_thread(all_consented, meeting_id):
            log.warning('Reunión sin consentimiento de todos los invitados; no se conecta')
            return
    except Exception:
        log.exception('No se pudo comprobar la autorización inicial; se deniega el acceso')
        return

    stop = asyncio.Event()
    tasks = set()
    active_tracks = set()

    async def validate_room():
        """Si hay revocación, error de red o participante no invitado, cierra el agente."""
        try:
            while not stop.is_set():
                if not await asyncio.to_thread(all_consented, meeting_id):
                    log.warning('Consentimiento ya no vigente: detener transcriptor')
                    stop.set()
                    return
                for participant in list(ctx.room.remote_participants.values()):
                    if not await asyncio.to_thread(invited_member, meeting_id, participant.identity):
                        log.warning('Se detectó un participante no autorizado; detener')
                        stop.set()
                        return
                try:
                    await asyncio.wait_for(stop.wait(), timeout=1.0)
                except asyncio.TimeoutError:
                    pass
        except Exception:
            log.exception('No pudo verificarse autorización continua; detener')
            stop.set()

    async def process_track(track, publication, participant):
        audio = None
        speech = None
        try:
            member_id = await asyncio.to_thread(invited_member, meeting_id, participant.identity)
            if not member_id or not await asyncio.to_thread(all_consented, meeting_id):
                stop.set()
                return
            # Una sesión STT independiente por micrófono evita mezclar voces de participantes.
            speech = inference.STT(model='deepgram/nova-3', language='es').stream()
            audio = rtc.AudioStream(track, sample_rate=16000, num_channels=1)

            async def consume_transcripts():
                async for event in speech:
                    if stop.is_set() or event.type != SpeechEventType.FINAL_TRANSCRIPT:
                        continue
                    if not event.alternatives:
                        continue
                    text = event.alternatives[0].text.strip()
                    if not text:
                        continue
                    identifier = str(uuid.uuid4())
                    try:
                        await asyncio.to_thread(save_segment, meeting_id, member_id, identifier, text)
                        if not stop.is_set():
                            await ctx.room.local_participant.send_text(
                                text,
                                topic='domus.transcription',
                                attributes={'member_id': member_id, 'segment_key': identifier},
                            )
                    except Exception:
                        log.exception('Falló verificación/guardado; detener para proteger datos')
                        stop.set()
                        return

            listener = asyncio.create_task(consume_transcripts())
            try:
                async for frame_event in audio:
                    if stop.is_set():
                        break
                    speech.push_frame(frame_event.frame)
            finally:
                # Descartar el audio pendiente si cesó el consentimiento.
                if not stop.is_set():
                    speech.end_input()
                    await listener
                else:
                    listener.cancel()
                    await asyncio.gather(listener, return_exceptions=True)
        except asyncio.CancelledError:
            raise
        except Exception:
            log.exception('Error de transcripción; detener')
            stop.set()
        finally:
            if audio is not None:
                await audio.aclose()
            if speech is not None:
                await speech.aclose()
            active_tracks.discard(publication.sid)

    def on_track(track, publication, participant):
        if stop.is_set() or not isinstance(track, rtc.RemoteAudioTrack):
            return
        if publication.source != rtc.TrackSource.SOURCE_MICROPHONE:
            return
        if publication.sid in active_tracks:
            return
        active_tracks.add(publication.sid)
        task = asyncio.create_task(process_track(track, publication, participant))
        tasks.add(task)
        task.add_done_callback(tasks.discard)

    ctx.room.on('track_subscribed', on_track)
    ctx.room.on('disconnected', lambda *args: stop.set())
    try:
        await ctx.connect()
        # Cubrir micrófonos publicados antes de que el agente entre.
        for participant in list(ctx.room.remote_participants.values()):
            for publication in participant.track_publications.values():
                if publication.track is not None and publication.subscribed:
                    on_track(publication.track, publication, participant)
        watcher = asyncio.create_task(validate_room())
        await stop.wait()
        watcher.cancel()
        await asyncio.gather(watcher, return_exceptions=True)
    finally:
        stop.set()
        for task in list(tasks):
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)
        await ctx.room.disconnect()


if __name__ == '__main__':
    cli.run_app(server)
