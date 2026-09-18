/* Domus Salud | consentimiento individual y transcripciones.
 * Solo Supabase es fuente fiable: un texto LiveKit únicamente dispara una recarga con JWT/RLS.
 */
(() => {
  'use strict';
  const root = document.querySelector('[data-video-call]');
  if (!root) return;
  const $ = (selector) => root.querySelector(selector);
  const panel = $('[data-video-transcript]');
  const toggle = $('[data-video-transcript-toggle]');
  const close = $('[data-video-transcript-close]');
  const stage = $('[data-video-call-main]');
  const consents = $('[data-video-transcript-consents]');
  const accept = $('[data-video-transcript-accept]');
  const decline = $('[data-video-transcript-decline]');
  const begin = $('[data-video-transcript-start]');
  const end = $('[data-video-transcript-stop]');
  const state = $('[data-video-transcript-state]');
  const history = $('[data-video-transcript-segments]');
  const topic = 'domus.transcription';
  const timeFormat = new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit' });
  let current = null;
  let timer = null;

  function message(value, error = false) {
    state.textContent = value;
    state.dataset.error = String(error);
  }
  function hide() {
    panel.hidden = true;
    toggle.textContent = 'Ver transcripción';
    toggle.setAttribute('aria-expanded', 'false');
    stage.dataset.transcriptOpen = 'false';
    stage.dataset.chatOpen = String(!$('[data-video-chat]')?.hidden);
  }
  function show() {
    window.DomusVideoChat?.hide();
    panel.hidden = false;
    toggle.textContent = 'Ocultar transcripción';
    toggle.setAttribute('aria-expanded', 'true');
    stage.dataset.transcriptOpen = 'true';
    stage.dataset.chatOpen = 'true';
  }
  function memberName(session, id) {
    const person = session.meeting.participants.find((entry) => entry.member_id === id);
    return person?.video_members?.display_name || (id === session.member.id ? session.member.display_name : 'Participante');
  }
  function renderSegments(session) {
    if (current !== session) return;
    const scroll = history.parentElement;
    const atBottom = scroll.scrollHeight - scroll.scrollTop - scroll.clientHeight < 90;
    const ordered = [...session.segments.values()].sort((a,b) =>
      a.starts_at.localeCompare(b.starts_at) || a.id.localeCompare(b.id));
    history.replaceChildren();
    if (!ordered.length) {
      const empty = document.createElement('p');
      empty.className = 'video-chat-empty';
      empty.textContent = 'Todavía no hay texto transcrito. El audio no se procesa hasta que todas las personas autoricen y se active el agente.';
      history.append(empty);
    }
    for (const segment of ordered) {
      const article = document.createElement('article');
      article.className = 'video-transcript-line';
      const author = document.createElement('strong');
      author.textContent = memberName(session, segment.member_id);
      const time = document.createElement('time');
      time.dateTime = segment.starts_at;
      const date = new Date(segment.starts_at);
      time.textContent = Number.isNaN(date.getTime()) ? '' : timeFormat.format(date);
      const body = document.createElement('p');
      body.textContent = segment.content; // Nunca insertar texto transcrito como HTML.
      article.append(author, time, body);
      history.append(article);
    }
    if (atBottom) scroll.scrollTop = scroll.scrollHeight;
  }
  function renderControls(session) {
    if (current !== session) return;
    const choices = new Map(session.consents.map((item) => [item.member_id, item.accepted]));
    const allAccepted = session.meeting.participants.length > 0 &&
      session.meeting.participants.every((person) => choices.get(person.member_id) === true);
    const own = choices.get(session.member.id);
    consents.replaceChildren();
    for (const person of session.meeting.participants) {
      const choice = choices.get(person.member_id);
      const line = document.createElement('div');
      line.className = 'video-transcript-member';
      line.dataset.consent = String(choice === undefined ? 'pending' : choice);
      const name = document.createElement('span');
      name.textContent = memberName(session, person.member_id);
      const status = document.createElement('span');
      status.textContent = choice === true ? 'Autorizó' : choice === false ? 'No autorizó' : 'Pendiente';
      line.append(name, status);
      consents.append(line);
    }
    const busy = session.busy || session.loading;
    accept.disabled = busy || own === true;
    decline.disabled = busy || own === false;
    const active = session.runStatus === 'active' || session.runStatus === 'starting';
    begin.hidden = session.member.role !== 'admin';
    begin.disabled = busy || session.member.role !== 'admin' || active || !allAccepted ||
      session.room?.state !== 'connected';
    end.disabled = busy || !active;
    if (!session.manualMessage) {
      if (session.runStatus === 'active') message('Transcripción solicitada al agente. El texto aparecerá cuando comience a procesar voz. Puedes detenerla cuando quieras.');
      else if (session.runStatus === 'starting') message('Preparando agente de transcripción...');
      else if (!allAccepted) message('Transcripción desactivada. Deben autorizar todos los invitados, incluso si aún no se conectan.');
      else message(session.member.role === 'admin'
        ? 'Todos autorizaron. Puedes iniciar la transcripción desde este botón.'
        : 'Todos autorizaron. Espera que un administrador inicie la transcripción.');
    }
  }
  async function refresh(session, initial = false) {
    if (session !== current || session.refreshing) return;
    session.refreshing = true;
    try {
      const [permissionResult, runResult] = await Promise.all([
        session.db.from('video_transcription_consent')
          .select('meeting_id,member_id,accepted,decided_at').eq('meeting_id', session.meeting.id),
        session.db.from('video_transcription_runs')
          .select('meeting_id,status,run_id,updated_at').eq('meeting_id',session.meeting.id).maybeSingle()
      ]);
      if (permissionResult.error) throw permissionResult.error;
      if (runResult.error) throw runResult.error;
      if (session !== current) return;
      session.consents = permissionResult.data || [];
      session.runStatus = runResult.data?.status || 'stopped';
      // Solo registros guardados y autorizados por RLS; jamás confiar en texto del canal LiveKit.
      let query = session.db.from('video_transcript_segments')
        .select('id,meeting_id,member_id,content,starts_at,ends_at')
        .eq('meeting_id', session.meeting.id);
      if (session.lastTimestamp) query = query.gte('starts_at', session.lastTimestamp).order('starts_at', {ascending: true});
      else query = query.order('starts_at', {ascending: false});
      const segmentsResult = await query.limit(250);
      if (segmentsResult.error) throw segmentsResult.error;
      if (session !== current) return;
      let changed = false;
      for (const segment of segmentsResult.data || []) {
        if (!session.segments.has(segment.id)) { session.segments.set(segment.id, segment); changed = true; }
        if (!session.lastTimestamp || segment.starts_at > session.lastTimestamp) session.lastTimestamp = segment.starts_at;
      }
      if (changed || initial) renderSegments(session);
      session.loading = false;
      if (!session.busy) session.manualMessage = false;
      renderControls(session);
    } catch (error) {
      if (session === current) {
        session.loading = false;
        session.manualMessage = true;
        message(`No se pudo consultar la transcripción: ${error.message || 'error de conexión'}. Revisa el SQL incremental.`, true);
        // Ante error de RLS/Supabase, nunca habilitar la activación.
        begin.disabled = true;
      }
    } finally { session.refreshing = false; }
  }
  async function requestServer(session, action) {
    const { data: { session: authSession }, error } = await session.db.auth.getSession();
    if (error || !authSession?.access_token) throw new Error('Tu sesión de Supabase venció.');
    const response = await fetch('/api/video-transcription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authSession.access_token}` },
      body: JSON.stringify({ meetingId: session.meeting.id, action }), cache: 'no-store'
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `Error del servidor (${response.status})`);
    return result;
  }
  async function choose(accepted) {
    const session = current;
    if (!session || session.busy || session.loading) return;
    session.busy = true; session.manualMessage = true;
    renderControls(session);
    message(accepted ? 'Registrando autorización...' : 'Retirando permiso y solicitando detención...');
    try {
      const { data, error } = await session.db.rpc('video_set_transcription_consent', {
        p_meeting_id: session.meeting.id, p_accepted: accepted
      });
      if (error || data !== true) throw error || new Error('Supabase no confirmó tu decisión.');
      if (!accepted) {
        // La RPC ya revoca a nivel de base; si falla la llamada Vercel, el agente
        // verá status=stopped y no podrá guardar nuevos segmentos.
        try { await requestServer(session, 'stop'); }
        catch (_) { message('Permiso retirado en Supabase. LiveKit se detendrá al comprobar el estado.', true); }
      }
      if (session !== current) return;
      session.consents = session.consents.filter((item) => item.member_id !== session.member.id);
      session.consents.push({ member_id: session.member.id, accepted });
      if (!accepted) session.runStatus = 'stopped';
      message(accepted ? 'Tu autorización quedó registrada.' : 'Tu autorización fue retirada. Se detuvo la autorización de transcripción.');
    } catch (error) {
      if (session === current) message(`No se pudo guardar tu decisión: ${error.message}`, true);
    } finally {
      if (session === current) { session.busy = false; renderControls(session); void refresh(session); }
    }
  }
  async function control(action) {
    const session = current;
    if (!session || session.busy || session.loading) return;
    session.busy = true; session.manualMessage = true;
    renderControls(session);
    message(action === 'start' ? 'Solicitando activación segura...' : 'Deteniendo transcripción...');
    try {
      const result = await requestServer(session, action);
      if (session !== current) return;
      session.runStatus = result.status;
      message(result.warning || result.message || (action === 'stop' ? 'Transcripción detenida.' : 'Agente solicitado. Espera su conexión.'), Boolean(result.warning));
    } catch (error) {
      if (session === current) message(error.message, true);
    } finally {
      if (session === current) { session.busy = false; renderControls(session); void refresh(session); }
    }
  }
  function stop() {
    const session = current;
    current = null;
    if (timer !== null) { clearInterval(timer); timer = null; }
    if (session?.room?.unregisterTextStreamHandler) {
      try { session.room.unregisterTextStreamHandler(topic); } catch (_) { /* desconectando */ }
    }
    hide();
    consents.textContent = 'Ingresa a una reunión para consultar los consentimientos.';
    history.replaceChildren();
    const empty = document.createElement('p'); empty.className='video-chat-empty'; empty.textContent='Todavía no hay texto transcrito.'; history.append(empty);
    accept.disabled = decline.disabled = begin.disabled = end.disabled = true;
    message('La transcripción está desactivada.');
  }
  async function start(room, meeting, db, member) {
    stop();
    if (!room || !db || !member || !meeting?.id ||
        !meeting.participants?.some((person) => person.member_id === member.id)) {
      message('No se pudo verificar tu participación en la reunión.', true);
      return;
    }
    const session = { room, meeting, db, member, consents: [], segments: new Map(),
      lastTimestamp: null, runStatus: 'stopped', busy: false, loading: true,
      refreshing: false, manualMessage: false };
    current = session;
    // El mensaje LiveKit es un aviso sin autoridad: recuperar siempre la fila persistida con RLS.
    if (typeof room.registerTextStreamHandler === 'function') {
      room.registerTextStreamHandler(topic, async (reader) => {
        try { await reader.readAll(); } catch (_) { /* canal efímero */ }
        if (session === current) void refresh(session);
      });
    }
    timer = setInterval(() => {
      if (session === current && !document.hidden && room.state === 'connected') void refresh(session);
    }, 3000);
    await refresh(session, true);
  }
  toggle.addEventListener('click', () => panel.hidden ? show() : hide());
  close.addEventListener('click', hide);
  accept.addEventListener('click', () => void choose(true));
  decline.addEventListener('click', () => void choose(false));
  begin.addEventListener('click', () => void control('start'));
  end.addEventListener('click', () => void control('stop'));
  stop();
  window.DomusTranscription = { start, stop, hide };
})();
