/* Domus Salud | Agenda persistente con Supabase Auth + RLS.
 * No usa sessionStorage para reuniones. Los correos se integrarán en otra etapa.
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
  let connected = false;

  function flash(message, error = false) {
    if (!pageMessage) return;
    pageMessage.textContent = message;
    pageMessage.dataset.error = String(error);
  }
  function hideAgenda(message = '') {
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
    if (!db || !db.auth) {
      hideAgenda('Falta configurar el cliente de Supabase en js/supabase-config.js.');
      return;
    }
    authMessage.textContent = 'Verificando acceso seguro...';
    try {
      const { data: { user }, error: authError } = await db.auth.getUser();
      if (authError || !user) {
        hideAgenda('Para utilizar la agenda, ingresa con una cuenta creada en Supabase Authentication y vinculada a tu perfil de Domus.');
        return;
      }
      const { data: profile, error } = await db.from('video_members')
        .select('id,display_name,email,role,active,auth_user_id')
        .eq('auth_user_id', user.id).maybeSingle();
      if (error) throw new Error(`${error.message}. Revisa que ejecutaste el SQL de Video llamadas.`);
      const current = typeof getCurrentAdmin === 'function' ? getCurrentAdmin() : null;
      if (!profile || !profile.active || profile.role !== 'admin') {
        hideAgenda('Esta cuenta de Supabase no está vinculada a un administrador activo en video_members. Revisa el vínculo en SQL Editor.');
        return;
      }
      if (!current || profile.id !== `admin:${current.id}`) {
        hideAgenda('La cuenta de Supabase conectada no corresponde al administrador que inició sesión en Domus. Desconéctala y utiliza la cuenta correcta.');
        return;
      }
      member = profile;
      connected = true;
      access.hidden = true;
      ready.hidden = false;
      await loadRoster();
      await loadMonth();
    } catch (error) {
      hideAgenda(`No fue posible conectar la agenda: ${error.message || 'error de red'}`);
    }
  }
  async function loadRoster() {
    const { data, error } = await db.from('video_members')
      .select('id,display_name,email,role,active').eq('active', true).order('display_name');
    if (error) throw error;
    roster = data || [];
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
      flash('Agenda guardada en Supabase. Videollamadas disponibles para invitados durante el horario programado; correos aún no enviados.');
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
  async function openCreate() {
    if (!connected || !member) return;
    try {
      await loadRoster();
    } catch (error) {
      flash(`No fue posible cargar los participantes: ${error.message}`, true); return;
    }
    const form = el('[data-video-form]'); form.reset();
    form.elements.date.value = selectedDate;
    const current = new Date();
    const suggested = new Date(current.getFullYear(), current.getMonth(), current.getDate(), current.getHours(), Math.ceil(current.getMinutes() / 15) * 15);
    form.elements.time.value = selectedDate === toKey(current) ? `${pad(suggested.getHours())}:${pad(suggested.getMinutes())}` : '10:00';
    el('[data-video-message]').textContent = '';
    el('[data-video-participants]').innerHTML = roster.map((person) => {
      const self = person.id === member.id;
      return `<label class="video-participant-row"><input type="checkbox" name="participant" value="${escape(person.id)}" ${self ? 'checked disabled' : ''} />
        <span class="video-avatar" aria-hidden="true">${escape(person.display_name.slice(0, 1).toUpperCase())}</span>
        <span class="video-person-text"><strong>${escape(person.display_name)}</strong><small>${escape(person.email || 'Correo pendiente de registrar')} · ${escape(person.role === 'admin' ? 'Administración' : 'Profesional')}</small></span>
        ${self ? '<span class="video-you">Tú</span>' : ''}</label>`;
    }).join('');
    el('[data-video-dialog]').hidden = false;
    form.elements.title.focus();
  }
  function closeCreate() { el('[data-video-dialog]').hidden = true; }
  function openDetail(id) {
    const meeting = meetings.find((item) => item.id === id);
    if (!meeting) return;
    detailId = id;
    el('[data-video-detail-title]').textContent = meeting.title;
    const list = meeting.participants || [];
    el('[data-video-detail-content]').innerHTML = `
      <span class="video-preview-status">Guardada en Supabase · Invitaciones por correo no enviadas</span>
      <h3>Fecha y hora</h3><p>${escape(dayFormat.format(fromKey(meeting.date)))} · ${escape(meeting.time)} · ${escape(meeting.duration)} minutos</p>
      <h3>Descripción</h3><p>${escape(meeting.description || 'Sin descripción.')}</p>
      <h3>Participantes (${list.length})</h3><ul>${list.map((p) => `<li>${escape(p.video_members?.display_name || p.member_id)}${p.video_members?.email ? ` · ${escape(p.video_members.email)}` : ' · correo pendiente'} · ${p.email_status === 'not_applicable' ? 'Organizador' : 'Correo aún no enviado'}</li>`).join('')}</ul>
      <h3>Videollamada</h3><p>Acceso protegido con Supabase Auth. Puedes ingresar desde 15 minutos antes de la reunión y hasta 15 minutos después del término.</p>`;
    el('[data-video-join]').disabled = !meeting.participants.some((p) => p.member_id === member?.id);
    el('[data-video-detail-dialog]').hidden = false;
  }
  function closeDetail() { el('[data-video-detail-dialog]').hidden = true; detailId = null; }

  el('[data-video-login]').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!db?.auth) { authMessage.textContent = 'Supabase no está configurado.'; return; }
    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    authMessage.textContent = 'Iniciando sesión segura...';
    try {
      const { error } = await db.auth.signInWithPassword({ email: form.elements.email.value.trim(), password: form.elements.password.value });
      form.elements.password.value = '';
      if (error) throw error;
      await connect();
    } catch (error) {
      authMessage.textContent = `No fue posible acceder: ${error.message}`;
    } finally { button.disabled = false; }
  });
  all('[data-video-disconnect]').forEach((button) => button.addEventListener('click', async () => {
    await window.DomusVideoCall?.leave();
    if (db?.auth) await db.auth.signOut();
    hideAgenda('La agenda fue desconectada. Puedes iniciar sesión con otra cuenta de Supabase.');
  }));
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
    if (!Number.isFinite(start.getTime()) || start.getTime() < Date.now()) {
      message.textContent = 'Selecciona una fecha y hora futuras.'; return;
    }
    const ids = [...form.querySelectorAll('input[name="participant"]:checked')].map((checkbox) => checkbox.value).filter((id) => id !== member.id);
    submitting = true;
    const button = form.querySelector('button[type="submit"]'); button.disabled = true;
    message.textContent = 'Guardando en Supabase...';
    try {
      const { data: id, error } = await db.rpc('video_create_meeting', {
        p_title: title, p_description: description, p_starts_at: start.toISOString(),
        p_duration_minutes: duration, p_participant_ids: ids,
        p_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Santiago'
      });
      if (error) throw error;
      selectedDate = date;
      const parsed = fromKey(date); viewYear = parsed.getFullYear(); viewMonth = parsed.getMonth();
      closeCreate();
      await loadMonth();
      if (meetings.some((meeting) => meeting.id === id)) openDetail(id);
      else flash('La reunión fue guardada en Supabase. Actualiza la agenda para consultar el detalle. No se enviaron correos.', false);
    } catch (error) {
      message.textContent = `No se pudo guardar: ${error.message}`;
    } finally { submitting = false; button.disabled = false; }
  });
  el('[data-video-join]').addEventListener('click', async () => {
    const meeting = meetings.find((item) => item.id === detailId);
    if (!meeting || !connected || !member) return;
    const button = el('[data-video-join]');
    button.disabled = true;
    try {
      if (!window.DomusVideoCall) throw new Error('No se cargó el módulo LiveKit. Actualiza la página.');
      await window.DomusVideoCall.join(meeting, db);
      closeDetail();
    } catch (error) { flash(error.message || 'No se pudo ingresar a la reunión.', true); }
    finally { button.disabled = false; }
  });
  el('[data-video-delete]').addEventListener('click', async () => {
    if (!connected || !detailId || !window.confirm('¿Cancelar esta reunión? Se conservará su registro en Supabase. Todavía no se enviarán correos de cancelación.')) return;
    const button = el('[data-video-delete]'); button.disabled = true;
    try {
      const { data, error } = await db.rpc('video_cancel_meeting', { p_meeting_id: detailId });
      if (error) throw error;
      if (!data) throw new Error('Solo el organizador puede cancelar una reunión activa.');
      closeDetail(); await loadMonth();
      flash('Reunión cancelada en Supabase. No se enviaron correos.');
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
  hideAgenda('La agenda requiere acceso con Supabase Auth. La cuenta debe estar vinculada en el directorio video_members.');
})();
