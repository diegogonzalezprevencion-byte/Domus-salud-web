/* LiveKit: pantalla de reunión. Token exclusivo del servidor Vercel. */
(() => {
  'use strict';
  const overlay = document.querySelector('[data-video-call]');
  if (!overlay) return;
  const grid = overlay.querySelector('[data-video-call-grid]');
  const status = overlay.querySelector('[data-video-call-status]');
  const mic = overlay.querySelector('[data-video-mic]');
  const camera = overlay.querySelector('[data-video-camera]');
  const screen = overlay.querySelector('[data-video-screen]');
  let room = null;
  let joining = false;
  let screenTrack = false;
  const tiles = new Map();
  const setStatus = (message) => { status.textContent = message; };
  function tile(identity, name) {
    if (tiles.has(identity)) return tiles.get(identity);
    const node = document.createElement('div'); node.className = 'video-call-tile';
    const media = document.createElement('div'); media.className = 'video-call-media';
    const caption = document.createElement('span'); caption.textContent = name || 'Participante';
    node.append(media, caption); grid.append(node); tiles.set(identity, node);
    return node;
  }
  function attach(track, participant) {
    const host = tile(participant.identity, participant.name).querySelector('.video-call-media');
    const element = track.attach();
    element.autoplay = true;
    element.playsInline = true;
    element.dataset.trackSid = track.sid || '';
    host.append(element);
  }
  function detach(track) {
    track.detach().forEach((element) => element.remove());
  }
  function renderLocal() {
    if (!room) return;
    const local = room.localParticipant;
    const node = tile(local.identity, `${local.name || 'Yo'} (tú)`);
    const host = node.querySelector('.video-call-media');
    host.replaceChildren();
    for (const publication of local.videoTrackPublications.values()) {
      if (publication.track && publication.source === window.LivekitClient.Track.Source.Camera) {
        const video = publication.track.attach(); video.muted = true; video.playsInline = true; host.append(video);
      }
    }
    mic.textContent = local.isMicrophoneEnabled ? 'Silenciar micrófono' : 'Activar micrófono';
    camera.textContent = local.isCameraEnabled ? 'Apagar cámara' : 'Activar cámara';
  }
  async function leave() {
    // Limpiar consultas, notificaciones y formulario del chat antes de abandonar la sala.
    window.DomusVideoChat?.stop();
    if (room) {
      const previous = room; room = null;
      try { await previous.disconnect(); } catch (_) {}
    }
    overlay.hidden = true; grid.replaceChildren(); tiles.clear(); screenTrack = false;
    setStatus('Desconectado');
  }
  async function join(meeting, db, member) {
    if (joining || room) throw new Error('Ya existe una videollamada abierta.');
    if (!window.LivekitClient?.Room) throw new Error('El cliente LiveKit no se cargó. Comprueba tu conexión y actualiza la página.');
    joining = true; overlay.hidden = false;
    overlay.querySelector('[data-video-call-title]').textContent = meeting.title;
    setStatus('Validando acceso y preparando sala...');
    try {
      const { data: { session }, error } = await db.auth.getSession();
      if (error || !session?.access_token) throw new Error('Tu sesión de Supabase venció. Vuelve a ingresar.');
      const response = await fetch('/api/video-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ meetingId: meeting.id }),
        cache: 'no-store'
      });
      const credentials = await response.json().catch(() => ({}));
      if (!response.ok || !credentials.token || !credentials.url) throw new Error(credentials.error || 'No fue posible obtener acceso a LiveKit.');
      const client = window.LivekitClient;
      const nextRoom = new client.Room({ adaptiveStream: true, dynacast: true });
      room = nextRoom;
      nextRoom.on(client.RoomEvent.TrackSubscribed, attach);
      nextRoom.on(client.RoomEvent.TrackUnsubscribed, detach);
      nextRoom.on(client.RoomEvent.ParticipantDisconnected, (participant) => {
        tiles.get(participant.identity)?.remove(); tiles.delete(participant.identity);
      });
      nextRoom.on(client.RoomEvent.LocalTrackPublished, renderLocal);
      nextRoom.on(client.RoomEvent.LocalTrackUnpublished, renderLocal);
      nextRoom.on(client.RoomEvent.Disconnected, () => { if (room === nextRoom) void leave(); });
      setStatus('Conectando con LiveKit...');
      await nextRoom.connect(credentials.url, credentials.token);
      tile(nextRoom.localParticipant.identity, `${nextRoom.localParticipant.name || 'Yo'} (tú)`);
      for (const participant of nextRoom.remoteParticipants.values()) {
        tile(participant.identity, participant.name);
        for (const publication of participant.trackPublications.values()) {
          if (publication.track && publication.isSubscribed) attach(publication.track, participant);
        }
      }
      setStatus('Conectado. Activa cámara y micrófono cuando quieras.');
      // Un fallo temporal del historial no debe cerrar una videollamada activa.
      if (window.DomusVideoChat) {
        try {
          // El chat carga en paralelo para que una consulta lenta no retrase la cámara.
          void window.DomusVideoChat.start(nextRoom, meeting, db, member)
            .catch((error) => setStatus(`Videollamada conectada. Chat: ${error.message || 'temporalmente no disponible'}.`));
        }
        catch (error) { setStatus(`Videollamada conectada. Chat: ${error.message || 'temporalmente no disponible'}.`); }
      }
      try { await nextRoom.localParticipant.enableCameraAndMicrophone(); }
      catch (_) { setStatus('Conectado. Permite cámara/micrófono en el navegador o usa los botones para activarlos.'); }
      renderLocal();
    } catch (error) { await leave(); throw error; }
    finally { joining = false; }
  }
  overlay.querySelectorAll('[data-video-leave]').forEach((button) => button.addEventListener('click', () => void leave()));
  mic.addEventListener('click', async () => {
    if (!room) return;
    mic.disabled = true;
    try { await room.localParticipant.setMicrophoneEnabled(!room.localParticipant.isMicrophoneEnabled); renderLocal(); }
    catch (error) { setStatus(`Micrófono: ${error.message}`); }
    finally { mic.disabled = false; }
  });
  camera.addEventListener('click', async () => {
    if (!room) return;
    camera.disabled = true;
    try { await room.localParticipant.setCameraEnabled(!room.localParticipant.isCameraEnabled); renderLocal(); }
    catch (error) { setStatus(`Cámara: ${error.message}`); }
    finally { camera.disabled = false; }
  });
  screen.addEventListener('click', async () => {
    if (!room) return;
    screen.disabled = true;
    try { await room.localParticipant.setScreenShareEnabled(!screenTrack); screenTrack = !screenTrack; screen.textContent = screenTrack ? 'Dejar de compartir' : 'Compartir pantalla'; }
    catch (error) { setStatus(`Pantalla: ${error.message}`); }
    finally { screen.disabled = false; }
  });
  window.DomusVideoCall = { join, leave };
})();
