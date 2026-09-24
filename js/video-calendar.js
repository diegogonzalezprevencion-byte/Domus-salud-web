/* Domus Salud | Agenda persistente en Supabase, invitaciones SMTP en Vercel.
 * Las reuniones nunca se guardan localmente; los envíos se confirman por destinatario.
 */
(() => {
  'use strict';
  const root = document.querySelector('[data-admin-view="video"]');
  if (!root) return;
  const db = window.domusSupabase;
  const el = (selector) => root.querySelector(selector);
  const all = (selector) => [...root.querySelectorAll(selector)];
  const access = el('[data-video-access]');
  const ready = el('[data-video-ready]');
  const authMessage = el('[data-video-auth-message]');
  const pageMessage = el('[data-video-status]');
  const monthFormat = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' });
  const dayFormat = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
  const pad = (n) => String(n).padStart(2, '0');
  const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fromKey = (key) => {
    const [y, m, d] = String(key).split('-').map(Number);
    const parsed = new Date(y, m - 1, d, 12);
    return parsed.getFullYear() === y && parsed.getMonth() === m - 1 && parsed.getDate() === d ? parsed : null;
  };
  const escape = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  const normalizeText = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');
  function personKey(person) {
    const email = String(person?.email || person?.video_members?.email || '').trim().toLowerCase();
    if (email) return `email:${email}`;
    const name = normalizeText(person?.display_name || person?.video_members?.display_name || '');
    return name ? `name:${name}` : `id:${person?.id || person?.member_id || ''}`;
  }
  function dedupePeople(rows) {
    const seen = new Set();
    return (rows || []).filter((row) => {
      const key = personKey(row);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  const now = new Date();
  let selectedDate = toKey(now);
  let viewYear = now.getFullYear();
  let viewMonth = now.getMonth();
  let detailId = null;
  let member = null;
  let roster = [];
  let meetings = [];
  let loadingId = 0;
  let submitting = false;
  let editingId = null;
  let connected = false;
  let notifying = false;
  const inviteParam = new URLSearchParams(window.location.search).get('reunion');
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  let pendingInvitation = UUID.test(inviteParam || '') ? inviteParam : null;
  let connectRequest = 0;

  function flash(message, error = false) {
    if (!pageMessage) return;
    pageMessage.textContent = message;
    pageMessage.dataset.error = String(error);
  }
  function hideAgenda(message = '') {
    connectRequest += 1;
    loadingId += 1;
    connected = false;
    member = null;
    meetings = [];
    ready.hidden = true;
    access.hidden = false;
    el('[data-video-dialog]').hidden = true;
    el('[data-video-detail-dialog]').hidden = true;
    if (message) authMessage.textContent = message;
  }
  async function connect() {
    const request = ++connectRequest;
    if (!db || !db.auth) {
      hideAgenda('Falta configurar el cliente de Supabase en js/supabase-config.js.');
      return;
    }
    authMessage.textContent = 'Verificando acceso seguro...';
    try {
      const { data: { user }, error: authError } = await db.auth.getUser();
      if (request !== connectRequest) return;
      if (authError || !user) {
        hideAgenda('Tu sesión de administrador no está disponible o ha vencido. Vuelve al acceso de Administrador para iniciar sesión una sola vez.');
        return;
      }
      const { data: profile, error } = await db.from('video_members')
        .select('id,display_name,email,role,active,auth_user_id')
        .eq('auth_user_id', user.id).maybeSingle();
      if (request !== connectRequest) return;
      if (error) throw new Error(`${error.message}. Revisa que ejecutaste el SQL de Video llamadas.`);
      const current = typeof getCurrentAdmin === 'function' ? getCurrentAdmin() : null;
      if (!profile || !profile.active || profile.role !== 'admin') {
        hideAgenda('Esta cuenta no está vinculada a un administrador activo. Revisa video_members en Supabase.');
        return;
      }
      if (!current || profile.id !== `admin:${current.id}`) {
        hideAgenda('La sesión autenticada no corresponde a este administrador. Vuelve a ingresar desde el acceso principal.');
        return;
      }
      member = profile;
      connected = true;
      access.hidden = true;
      ready.hidden = false;
      await loadRoster();
      if (request !== connectRequest) return;
      await loadMonth();
      if (pendingInvitation) await openInvitation(pendingInvitation);
    } catch (error) {
      if (request !== connectRequest) return;
      hideAgenda(`No fue posible conectar la agenda: ${error.message || 'error de red'}`);
    }
  }
  async function loadRoster() {
    const { data, error } = await db.from('video_members')
      .select('id,display_name,email,role,active').eq('active', true).order('display_name');
    if (error) throw error;
    roster = dedupePeople(data || []);
  }
  function normalizeMeeting(row, people) {
    const start = new Date(row.starts_at);
    return {
      ...row, date: toKey(start), time: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
      duration: row.duration_minutes, participants: people || []
    };
  }
  async function loadMonth() {
    if (!connected) return;
    const request = ++loadingId;
    flash('Cargando reuniones desde Supabase...');
    const start = new Date(viewYear, viewMonth, 1);
    const end = new Date(viewYear, viewMonth + 1, 1);
    try {
      const { data, error } = await db.from('video_meetings')
        .select('id,organizer_id,title,description,starts_at,timezone,duration_minutes,status,created_at')
        .eq('status', 'scheduled')
        .gte('starts_at', start.toISOString()).lt('starts_at', end.toISOString())
        .order('starts_at', { ascending: true });
      if (error) throw error;
      const ids = (data || []).map((item) => item.id);
      let participants = [];
      if (ids.length) {
        const result = await db.from('video_meeting_participants')
          .select('meeting_id,member_id,participation_status,email_status,video_members(display_name,email,role)')
          .in('meeting_id', ids);
        if (result.error) throw result.error;
        participants = result.data || [];
      }
      if (request !== loadingId) return;
      meetings = (data || []).map((item) => normalizeMeeting(item, participants.filter((person) => person.meeting_id === item.id)));
      flash('Agenda compartida guardada en Supabase. Los correos se envían desde Vercel y su estado se muestra en cada reunión.');
      render();
    } catch (error) {
      if (request !== loadingId) return;
      meetings = [];
      flash(`No se pudo cargar la agenda: ${error.message}`, true);
      render();
    }
  }
  function render() {
    el('[data-video-month]').textContent = monthFormat.format(new Date(viewYear, viewMonth, 1));
    const grid = el('[data-video-days]');
    grid.replaceChildren();
    const offset = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
    for (let i = 0; i < offset; i++) {
      const blank = document.createElement('span'); blank.className = 'video-day-empty'; grid.append(blank);
    }
    const total = new Date(viewYear, viewMonth + 1, 0).getDate();
    for (let day = 1; day <= total; day++) {
      const date = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'video-day'; button.textContent = String(day);
      button.setAttribute('aria-label', dayFormat.format(fromKey(date)));
      button.setAttribute('aria-pressed', String(date === selectedDate));
      button.dataset.today = String(date === toKey(new Date()));
      if (meetings.some((meeting) => meeting.date === date)) button.classList.add('has-meetings');
      button.addEventListener('click', () => { selectedDate = date; render(); });
      grid.append(button);
    }
    el('[data-video-agenda-date]').textContent = dayFormat.format(fromKey(selectedDate));
    const chosen = meetings.filter((meeting) => meeting.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time));
    el('[data-video-agenda-list]').innerHTML = chosen.length ? chosen.map((meeting) => `
      <button type="button" class="video-agenda-item" data-video-detail="${escape(meeting.id)}">
        <span class="video-agenda-time">${escape(meeting.time)}</span>
        <span><strong>${escape(meeting.title)}</strong><small>Ver detalle → · ${escape(meeting.duration)} min</small></span>
      </button>`).join('') : '<p class="video-agenda-empty">No hay reuniones programadas para este día.</p>';
  }
  function changeMonth(offset) {
    const d = new Date(viewYear, viewMonth + offset, 1);
    viewYear = d.getFullYear(); viewMonth = d.getMonth();
    const day = Math.min(Number(selectedDate.slice(-2)), new Date(viewYear, viewMonth + 1, 0).getDate());
    selectedDate = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
    render(); loadMonth();
  }
  function renderParticipantChoices(selected = new Set()) {
    el('[data-video-participants]').innerHTML = roster.map((person) => {
      const self = person.id === member.id;
      const checked = self || selected.has(person.id);
      return `<label class="video-participant-row"><input type="checkbox" name="participant" value="${escape(person.id)}" ${checked ? 'checked' : ''} ${self ? 'disabled' : ''} />
        <span class="video-avatar" aria-hidden="true">${escape(person.display_name.slice(0, 1).toUpperCase())}</span>
        <span class="video-person-text"><strong>${escape(person.display_name)}</strong><small>${escape(person.email || 'Correo pendiente de registrar')} · ${escape(person.role === 'admin' ? 'Administración' : 'Profesional (ingreso a sala pendiente)')}</small></span>
        ${self ? '<span class="video-you">Tú</span>' : ''}</label>`;
    }).join('');
  }
  async function openCreate() {
    if (!connected || !member) return;
    editingId = null;
    try {
      await loadRoster();
    } catch (error) {
      flash(`No fue posible cargar los participantes: ${error.message}`, true); return;
    }
    const form = el('[data-video-form]'); form.reset();
    el('[data-video-dialog-title]').textContent = 'Nueva reunión';
    el('[data-video-submit]').textContent = 'Crear reunión';
    form.elements.date.value = selectedDate;
    const current = new Date();
    const suggested = new Date(current.getFullYear(), current.getMonth(), current.getDate(), current.getHours(), Math.ceil(current.getMinutes() / 15) * 15);
    form.elements.time.value = selectedDate === toKey(current) ? `${pad(suggested.getHours())}:${pad(suggested.getMinutes())}` : '10:00';
    el('[data-video-message]').textContent = '';
    renderParticipantChoices();
    el('[data-video-dialog]').hidden = false;
    form.elements.title.focus();
  }
  async function openEdit() {
    const meeting = meetings.find((item) => item.id === detailId);
    if (!meeting || !member || meeting.organizer_id !== member.id) return;
    if (new Date(meeting.starts_at).getTime() - (15 * 60 * 1000) <= Date.now()) {
      flash('La reunión ya está dentro de la ventana de ingreso de 15 minutos y no puede editarse.', true);
      return;
    }
    try {
      await loadRoster();
    } catch (error) {
      flash(`No fue posible cargar los participantes: ${error.message}`, true); return;
    }
    editingId = meeting.id;
    const form = el('[data-video-form]');
    form.reset();
    el('[data-video-dialog-title]').textContent = 'Editar reunión';
    el('[data-video-submit]').textContent = 'Guardar cambios';
    form.elements.title.value = meeting.title || '';
    form.elements.description.value = meeting.description || '';
    form.elements.date.value = meeting.date;
    form.elements.time.value = meeting.time;
    form.elements.duration.value = String(meeting.duration);
    const selected = new Set((meeting.participants || []).map((p) => p.member_id));
    renderParticipantChoices(selected);
    el('[data-video-message]').textContent = 'Al guardar, se reenviará la invitación actualizada a los participantes vigentes.';
    closeDetail();
    el('[data-video-dialog]').hidden = false;
    form.elements.title.focus();
  }
  function closeCreate() {
    el('[data-video-dialog]').hidden = true;
    editingId = null;
  }
  async function openInvitation(id) {
    pendingInvitation = null;
    if (!connected) return;
    const { data: row, error } = await db.from('video_meetings')
      .select('id,starts_at,status').eq('id', id).maybeSingle();
    if (error || !row || row.status !== 'scheduled') {
      flash('No se encontró una reunión activa asociada a este enlace.', true); return;
    }
    const d = new Date(row.starts_at);
    viewYear = d.getFullYear(); viewMonth = d.getMonth(); selectedDate = toKey(d);
    await loadMonth();
    if (meetings.some((m) => m.id === id)) openDetail(id);
    else flash('No tienes permiso para consultar esta reunión.', true);
  }
  async function sendInvitations(meetingId) {
    if (notifying) return null;
    notifying = true;
    try {
      const { data: { session }, error: sessionError } = await db.auth.getSession();
      if (sessionError || !session?.access_token) throw new Error('Tu sesión venció. Ingresa de nuevo como administrador.');
      const response = await fetch('/api/video-invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ meetingId })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'No se pudo confirmar el envío de invitaciones.');
      return result;
    } finally { notifying = false; }
  }
  function emailLabel(person) {
    if (person.email_status === 'not_applicable') return 'Organizador · sin notificación (reunión antigua)';
    const statuses = {
      sent: 'Enviado al servidor de correo', failed: 'Error de envío',
      missing_email: 'Falta registrar correo', sending: 'Procesando envío',
      pending: 'Pendiente de envío', not_configured: 'Pendiente de envío'
    };
    return statuses[person.email_status] || 'Pendiente de envío';
  }
  function openDetail(id) {
    const meeting = meetings.find((item) => item.id === id);
    if (!meeting) return;
    detailId = id;
    el('[data-video-detail-title]').textContent = meeting.title;
    const list = dedupePeople(meeting.participants || []);
    el('[data-video-detail-content]').innerHTML = `
      <span class="video-preview-status">Guardada en Supabase · Consulta el estado del correo por participante</span>
      <h3>Fecha y hora</h3><p>${escape(dayFormat.format(fromKey(meeting.date)))} · ${escape(meeting.time)} · ${escape(meeting.duration)} minutos</p>
      <h3>Descripción</h3><p>${escape(meeting.description || 'Sin descripción.')}</p>
      <h3>Participantes (${list.length})</h3><ul>${list.map((p) => `<li>${escape(p.video_members?.display_name || p.member_id)}${p.video_members?.email ? ` · ${escape(p.video_members.email)}` : ' · correo pendiente'} · ${escape(emailLabel(p))}</li>`).join('')}</ul>
      <h3>Videollamada</h3><p>Acceso protegido con Supabase Auth. Puedes ingresar desde 15 minutos antes de la reunión y hasta 15 minutos después del término.</p>`;
    el('[data-video-join]').disabled = !meeting.participants.some((p) => p.member_id === member?.id);
    const resend = el('[data-video-resend]');
    resend.hidden = meeting.organizer_id !== member?.id || !list.some((p) =>
      p.email_status !== 'sent');
    resend.disabled = resend.hidden || notifying;
    const editButton = el('[data-video-edit]');
    editButton.hidden = meeting.organizer_id !== member?.id || new Date(meeting.starts_at).getTime() - (15 * 60 * 1000) <= Date.now();
    editButton.disabled = editButton.hidden;
    el('[data-video-detail-dialog]').hidden = false;
    root.dispatchEvent(new CustomEvent('domus:meeting-detail', { detail: {
      meetingId: meeting.id, organizerId: meeting.organizer_id, memberId: member?.id
    } }));
  }
  function closeDetail() { el('[data-video-detail-dialog]').hidden = true; detailId = null; }

  // No hay formulario de acceso a la agenda: se utiliza la sesión del administrador.
  el('[data-video-relogin]').addEventListener('click', () => {
    if (window.DomusAdminAuth?.logout) void window.DomusAdminAuth.logout();
  });
  db?.auth?.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') hideAgenda('Tu sesión terminó. Ingresa nuevamente desde Administrador.');
  });
  all('[data-video-new]').forEach((button) => button.addEventListener('click', openCreate));
  all('[data-video-close]').forEach((button) => button.addEventListener('click', closeCreate));
  all('[data-video-detail-close]').forEach((button) => button.addEventListener('click', closeDetail));
  el('[data-video-prev]').addEventListener('click', () => changeMonth(-1));
  el('[data-video-next]').addEventListener('click', () => changeMonth(1));
  el('[data-video-today]').addEventListener('click', () => {
    const today = new Date(); selectedDate = toKey(today); viewYear = today.getFullYear(); viewMonth = today.getMonth(); render(); loadMonth();
  });
  el('[data-video-refresh]').addEventListener('click', async () => { await loadRoster(); await loadMonth(); });
  el('[data-video-agenda-list]').addEventListener('click', (event) => {
    const button = event.target.closest('[data-video-detail]'); if (button) openDetail(button.dataset.videoDetail);
  });
  el('[data-video-form]').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!connected || submitting) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const title = String(values.get('title') || '').trim();
    const description = String(values.get('description') || '').trim();
    const date = String(values.get('date') || '');
    const time = String(values.get('time') || '');
    const duration = Number(values.get('duration'));
    const message = el('[data-video-message]');
    if (!title || !fromKey(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || ![15, 30, 45, 60, 90, 120].includes(duration)) {
      message.textContent = 'Revisa el título, fecha, hora y duración.'; return;
    }
    const start = new Date(`${date}T${time}:00`);
    if (!Number.isFinite(start.getTime()) || start.getTime() < Date.now() + (editingId ? 15 * 60 * 1000 : 0)) {
      message.textContent = editingId ? 'Al editar, la nueva hora debe quedar al menos 15 minutos hacia el futuro.' : 'Selecciona una fecha y hora futuras.'; return;
    }
    const ids = [...form.querySelectorAll('input[name="participant"]:checked')].map((checkbox) => checkbox.value).filter((id) => id !== member.id);
    const missingEmail = ids.map((id) => roster.find((person) => person.id === id))
      .filter((person) => !person || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email || ''));
    if (missingEmail.length) {
      message.textContent = `Registra un correo válido para: ${missingEmail.map((person) => person?.display_name || 'participante').join(', ')}. No se creará una invitación sin correo.`;
      return;
    }
    submitting = true;
    const button = form.querySelector('button[type="submit"]'); button.disabled = true;
    message.textContent = 'Guardando en Supabase...';
    try {
      const meetingId = editingId;
      let id = meetingId;
      if (meetingId) {
        const { data: updated, error } = await db.rpc('video_update_meeting', {
          p_meeting_id: meetingId,
          p_title: title,
          p_description: description,
          p_starts_at: start.toISOString(),
          p_duration_minutes: duration,
          p_participant_ids: ids,
          p_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Santiago'
        });
        if (error) throw error;
        if (!updated) throw new Error('No se pudo actualizar la reunión. Verifica que seas el organizador y que aún no haya comenzado.');
      } else {
        const { data: createdId, error } = await db.rpc('video_create_meeting', {
          p_title: title, p_description: description, p_starts_at: start.toISOString(),
          p_duration_minutes: duration, p_participant_ids: ids,
          p_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Santiago'
        });
        if (error) throw error;
        id = createdId;
      }
      selectedDate = date;
      const parsed = fromKey(date); viewYear = parsed.getFullYear(); viewMonth = parsed.getMonth();
      const wasEdit = Boolean(meetingId);
      closeCreate();
      let mailResult = null;
      let mailError = '';
      try { mailResult = await sendInvitations(id); }
      catch (notificationError) { mailError = notificationError.message || 'No se pudo enviar invitaciones.'; }
      await loadMonth();
      if (meetings.some((meeting) => meeting.id === id)) openDetail(id);
      if (mailError) flash(`${wasEdit ? 'Reunión actualizada' : 'Reunión guardada'} en Supabase. Invitaciones pendientes: ${mailError} Abre el detalle para reintentar.`, true);
      else flash(`${wasEdit ? 'Reunión actualizada' : 'Reunión guardada'}. ${mailResult.message} Enviados ahora: ${mailResult.sentNow}. Sin correo: ${mailResult.missing}.`, !mailResult.ok);
    } catch (error) {
      message.textContent = `No se pudo guardar: ${error.message}`;
    } finally { submitting = false; button.disabled = false; }
  });
  el('[data-video-minutes-open]').addEventListener('click', async () => {
    const meeting = meetings.find((row) => row.id === detailId);
    if (!meeting || !member || !window.DomusMeetingMinutes) return;
    closeDetail();
    await window.DomusMeetingMinutes.open(meeting,member,db);
  });
  el('[data-video-edit]').addEventListener('click', openEdit);
  el('[data-video-resend]').addEventListener('click', async () => {
    const meeting = meetings.find((row) => row.id === detailId);
    if (!meeting || !member || meeting.organizer_id !== member.id || notifying) return;
    const button = el('[data-video-resend]'); button.disabled = true;
    flash('Verificando y enviando invitaciones pendientes...');
    try {
      const outcome = await sendInvitations(meeting.id);
      await loadMonth();
      openDetail(meeting.id);
      flash(`${outcome.message} Enviados ahora: ${outcome.sentNow}. Total enviados: ${outcome.sentTotal}. Sin correo: ${outcome.missing}.`, !outcome.ok);
    } catch (error) {
      flash(`No se pudieron procesar las invitaciones: ${error.message}`, true);
    } finally { button.disabled = false; }
  });
  el('[data-video-join]').addEventListener('click', async () => {
    const meeting = meetings.find((item) => item.id === detailId);
    if (!meeting || !connected || !member) return;
    const button = el('[data-video-join]');
    button.disabled = true;
    try {
      if (!window.DomusVideoCall) throw new Error('No se cargó el módulo LiveKit. Actualiza la página.');
      await window.DomusVideoCall.join(meeting, db, member);
      closeDetail();
    } catch (error) { flash(error.message || 'No se pudo ingresar a la reunión.', true); }
    finally { button.disabled = false; }
  });
  el('[data-video-delete]').addEventListener('click', async () => {
    if (!connected || !detailId || !window.confirm('¿Cancelar esta reunión? Quedará cancelada en Supabase. Esta versión aún no envía avisos de cancelación.')) return;
    const button = el('[data-video-delete]'); button.disabled = true;
    try {
      const { data, error } = await db.rpc('video_cancel_meeting', { p_meeting_id: detailId });
      if (error) throw error;
      if (!data) throw new Error('Solo el organizador puede cancelar una reunión activa.');
      closeDetail(); await loadMonth();
      flash('Reunión cancelada en Supabase. Los avisos de cancelación aún no están habilitados.');
    } catch (error) { window.alert(`No fue posible cancelar: ${error.message}`); }
    finally { button.disabled = false; }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!el('[data-video-detail-dialog]').hidden) { event.stopImmediatePropagation(); closeDetail(); }
    else if (!el('[data-video-dialog]').hidden) { event.stopImmediatePropagation(); closeCreate(); }
  }, true);
  document.querySelector('[data-admin-tab="video"]')?.addEventListener('click', () => {
    if (typeof loadDomusCentralState === 'function') {
      loadDomusCentralState().then(connect).catch((error) => { hideAgenda(error.message); });
    } else connect();
  });
  hideAgenda('La agenda utilizará la sesión de tu administrador. Ingresa una sola vez con tu cuenta Supabase Auth.');
  window.DomusVideoAgenda = { connect };
})();
