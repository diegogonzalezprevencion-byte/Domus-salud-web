/* Domus Salud · chat de videollamadas.
 * Supabase/RLS es la fuente de verdad. LiveKit solo comunica que hay nuevos mensajes:
 * nunca se confía en texto o identidades recibidos por el canal de datos.
 * No requiere habilitar la publicación Realtime de Supabase (respaldo: consulta cada 4 s).
 */
(() => {
  'use strict';
  const root = document.querySelector('[data-video-call]');
  if (!root) return;
  const panel = root.querySelector('[data-video-chat]');
  const stage = root.querySelector('[data-video-call-main]');
  const toggle = root.querySelector('[data-video-chat-toggle]');
  const close = root.querySelector('[data-video-chat-close]');
  const more = root.querySelector('[data-video-chat-more]');
  const history = root.querySelector('[data-video-chat-history]');
  const messages = root.querySelector('[data-video-chat-messages]');
  const stateLabel = root.querySelector('[data-video-chat-state]');
  const form = root.querySelector('[data-video-chat-form]');
  const input = root.querySelector('[data-video-chat-input]');
  const sendButton = root.querySelector('[data-video-chat-send]');
  const counter = root.querySelector('[data-video-chat-counter]');
  const topic = 'domus.chat.notice.v1';
  const pageSize = 60;
  const timeFormat = new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit' });
  const textDecoder = new TextDecoder();
  const textEncoder = new TextEncoder();
  let active = null;
  let interval = null;

  function status(message, error = false) {
    stateLabel.textContent = message;
    stateLabel.dataset.error = String(error);
  }
  function expanded(open) {
    if (open) window.DomusTranscription?.hide();
    panel.hidden = !open;
    stage.dataset.chatOpen = String(open || stage.dataset.transcriptOpen === 'true');
    toggle.textContent = open ? 'Ocultar chat' : 'Mostrar chat';
    toggle.setAttribute('aria-expanded', String(open));
  }
  function enableComposer() {
    const enabled = Boolean(active && active.loaded && !active.sending);
    input.disabled = !enabled;
    sendButton.disabled = !enabled || !input.value.trim();
    counter.textContent = `${input.value.length} / 4000`;
  }
  function resetView() {
    messages.replaceChildren();
    more.hidden = true;
    input.value = '';
    input.disabled = true;
    sendButton.disabled = true;
    counter.textContent = '0 / 4000';
    status('Conecta con la reunión para consultar el chat.');
  }
  function nameOf(chat, memberId) {
    if (memberId === chat.member.id) return `${chat.member.display_name || 'Yo'} (tú)`;
    const person = chat.meeting.participants?.find((entry) => entry.member_id === memberId);
    return person?.video_members?.display_name || chat.room?.remoteParticipants?.get(memberId)?.name || 'Participante';
  }
  function render(chat, keepPosition = false) {
    if (chat !== active) return;
    const priorHeight = history.scrollHeight;
    const priorTop = history.scrollTop;
    const atBottom = priorHeight - priorTop - history.clientHeight < 85;
    messages.replaceChildren();
    const ordered = [...chat.rows.values()].sort((a, b) =>
      a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
    if (!ordered.length) {
      const blank = document.createElement('p');
      blank.className = 'video-chat-empty';
      blank.textContent = 'Todavía no hay mensajes. Inicia la conversación.';
      messages.append(blank);
    }
    for (const item of ordered) {
      const message = document.createElement('article');
      message.className = 'video-chat-message';
      message.dataset.own = String(item.sender_id === chat.member.id);
      const head = document.createElement('div');
      head.className = 'video-chat-message-head';
      const name = document.createElement('strong');
      name.textContent = nameOf(chat, item.sender_id);
      const time = document.createElement('time');
      time.dateTime = item.created_at;
      const date = new Date(item.created_at);
      time.textContent = Number.isNaN(date.getTime()) ? '' : timeFormat.format(date);
      time.title = Number.isNaN(date.getTime()) ? '' : date.toLocaleString('es-CL');
      head.append(name, time);
      const body = document.createElement('p');
      body.textContent = item.body; // Nunca insertar mensajes de usuario mediante innerHTML.
      message.append(head, body);
      messages.append(message);
    }
    more.hidden = !chat.hasOlder;
    if (keepPosition) history.scrollTop = priorTop + history.scrollHeight - priorHeight;
    else if (atBottom || !chat.rendered) history.scrollTop = history.scrollHeight;
    chat.rendered = true;
  }
  function addRows(chat, rows) {
    let changed = false;
    for (const row of rows) {
      if (!chat.rows.has(row.id)) { chat.rows.set(row.id, row); changed = true; }
    }
    return changed;
  }
  function messageQuery(db) {
    return db.from('video_chat_messages')
      .select('id,meeting_id,sender_id,body,created_at');
  }
  async function refresh(chat, first = false) {
    if (chat !== active) return;
    if (chat.syncing) { chat.pendingSync = true; return; }
    chat.syncing = true;
    try {
      const { data, error } = await messageQuery(chat.db)
        .eq('meeting_id', chat.meeting.id)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(pageSize);
      if (chat !== active) return;
      if (error) throw error;
      const rows = data || [];
      const changed = addRows(chat, rows);
      if (first) chat.hasOlder = rows.length === pageSize;
      chat.loaded = true;
      enableComposer();
      if (changed || first || !chat.rendered) render(chat);
      if (first) status('Chat conectado. Los mensajes se guardan en Supabase.');
      else if (stateLabel.dataset.error === 'true') status('Chat sincronizado.');
    } catch (error) {
      if (chat !== active) return;
      status(`No se pudo consultar el chat: ${error?.message || 'error de conexión'}. Comprueba el SQL del paso 1 y la sesión.`, true);
      if (first) { chat.loaded = false; enableComposer(); }
    } finally {
      chat.syncing = false;
      if (chat === active && chat.pendingSync) {
        chat.pendingSync = false;
        void refresh(chat);
      }
    }
  }
  async function loadOlder() {
    const chat = active;
    if (!chat?.loaded || !chat.hasOlder || chat.loadingOlder) return;
    const oldest = [...chat.rows.values()].sort((a, b) =>
      a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id))[0];
    if (!oldest) return;
    chat.loadingOlder = true;
    more.disabled = true;
    status('Cargando mensajes anteriores...');
    try {
      const { data, error } = await messageQuery(chat.db)
        .eq('meeting_id', chat.meeting.id)
        .or(`created_at.lt.${oldest.created_at},and(created_at.eq.${oldest.created_at},id.lt.${oldest.id})`)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(pageSize);
      if (chat !== active) return;
      if (error) throw error;
      const rows = data || [];
      chat.hasOlder = rows.length === pageSize;
      addRows(chat, rows);
      render(chat, true);
      status(rows.length ? 'Mensajes anteriores cargados.' : 'No hay mensajes anteriores.');
    } catch (error) {
      if (chat === active) status(`No se pudo cargar el historial: ${error?.message || 'error de conexión'}`, true);
    } finally {
      chat.loadingOlder = false;
      more.disabled = false;
    }
  }
  async function send(event) {
    event.preventDefault();
    const chat = active;
    if (!chat || chat.sending || !chat.loaded || !chat.room || chat.room.state !== 'connected') {
      status('Conecta con la sala antes de enviar un mensaje.', true);
      return;
    }
    const body = input.value.trim();
    if (!body || body.length > 4000) { status('Escribe un mensaje de hasta 4000 caracteres.', true); return; }
    chat.sending = true;
    enableComposer();
    status('Guardando mensaje...');
    let messageId;
    try {
      // La función SQL toma el remitente de auth.uid() y valida invitación.
      const { data, error } = await chat.db.rpc('video_send_chat', {
        p_meeting_id: chat.meeting.id,
        p_body: body
      });
      if (chat !== active) return;
      if (error) throw error;
      if (!data) throw new Error('Supabase no confirmó el mensaje.');
      messageId = data;
    } catch (error) {
      if (chat === active) status(`No se guardó el mensaje: ${error?.message || 'error de conexión'}`, true);
      return;
    } finally {
      chat.sending = false;
      enableComposer();
    }
    if (chat !== active) return;
    input.value = '';
    enableComposer();
    status('Mensaje guardado en Supabase.');
    // Notificar SOLO que existe un mensaje; los receptores leen la tabla con su JWT y RLS.
    try {
      await chat.room.localParticipant.publishData(
        textEncoder.encode(JSON.stringify({ type: 'chat-saved', meetingId: chat.meeting.id, id: messageId })),
        { reliable: true, topic }
      );
    } catch (_) {
      // La persistencia ya se completó. No pedir que reenvíe: otros clientes consultan cada 4 s.
    }
    if (chat === active) await refresh(chat);
  }
  function onNotice(chat, bytes, _participant, _kind, receivedTopic) {
    if (chat !== active || receivedTopic !== topic || bytes.byteLength > 1024) return;
    try {
      const notice = JSON.parse(textDecoder.decode(bytes));
      if (notice.type === 'chat-saved' && notice.meetingId === chat.meeting.id) void refresh(chat);
    } catch (_) { /* Ignorar paquetes ajenos, corruptos o no confiables. */ }
  }
  function stop() {
    const chat = active;
    active = null;
    if (interval !== null) { clearInterval(interval); interval = null; }
    if (chat) {
      const events = window.LivekitClient?.RoomEvent;
      if (events) {
        chat.room?.off?.(events.DataReceived, chat.onNotice);
        chat.room?.off?.(events.Reconnected, chat.onReconnect);
      }
    }
    resetView();
  }
  async function start(room, meeting, db, member) {
    stop();
    expanded(true);
    if (!db || !member || !meeting?.id || !meeting.participants?.some((person) => person.member_id === member.id)) {
      status('No se pudo confirmar tu acceso al chat. Vuelve a la agenda.', true);
      return;
    }
    const chat = {
      room, meeting, db, member, rows: new Map(), hasOlder: false,
      rendered: false, loaded: false, syncing: false, pendingSync: false,
      sending: false, loadingOlder: false
    };
    active = chat;
    const events = window.LivekitClient?.RoomEvent;
    chat.onNotice = (...args) => onNotice(chat, ...args);
    chat.onReconnect = () => { void refresh(chat); };
    if (events) {
      room.on(events.DataReceived, chat.onNotice);
      room.on(events.Reconnected, chat.onReconnect);
    }
    status('Recuperando el historial de mensajes...');
    interval = setInterval(() => {
      if (chat === active && !document.hidden && chat.room?.state === 'connected') void refresh(chat);
    }, 4000);
    await refresh(chat, true);
  }

  toggle.addEventListener('click', () => expanded(panel.hidden));
  close.addEventListener('click', () => expanded(false));
  input.addEventListener('input', enableComposer);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      if (!sendButton.disabled) form.requestSubmit();
    }
  });
  form.addEventListener('submit', (event) => { void send(event); });
  more.addEventListener('click', () => { void loadOlder(); });
  resetView();
  expanded(true);
  window.DomusVideoChat = { start, stop, hide: () => expanded(false) };
})();
