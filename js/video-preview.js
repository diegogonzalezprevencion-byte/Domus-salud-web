/* Vista previa de Video llamadas · Sin Supabase/LiveKit/SMTP.
 * Los datos de esta prueba viven exclusivamente en sessionStorage del navegador.
 * No se envían notificaciones ni se crean salas de videollamada.
 */
(() => {
  'use strict';
  const root = document.querySelector('[data-admin-view="video"]');
  if (!root) return;
  const el = (selector) => root.querySelector(selector);
  const all = (selector) => [...root.querySelectorAll(selector)];
  const storageKey = 'domus_video_preview_meetings_v1';
  const monthFormat = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' });
  const dayFormat = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
  const clockFormat = new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
  const pad = (n) => String(n).padStart(2, '0');
  const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fromKey = (key) => {
    const [y, m, d] = String(key).split('-').map(Number);
    const parsed = new Date(y, m - 1, d, 12);
    return parsed.getFullYear() === y && parsed.getMonth() === m - 1 && parsed.getDate() === d ? parsed : null;
  };
  const html = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  const nameKey = (name) => String(name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  const now = new Date();
  let selectedDate = toKey(now);
  let viewYear = now.getFullYear();
  let viewMonth = now.getMonth();
  let detailId = null;
  let meetings = [];
  try {
    const parsed = JSON.parse(sessionStorage.getItem(storageKey) || '[]');
    if (Array.isArray(parsed)) meetings = parsed.filter((meeting) => meeting && typeof meeting.id === 'string' && fromKey(meeting.date) && /^\d\d:\d\d$/.test(meeting.time || ''));
  } catch (_) { meetings = []; }

  function roster() {
    // La lista administrativa y los profesionales provienen de los datos existentes.
    // Un integrante que posee ambos perfiles aparece una sola vez como persona.
    const admins = typeof getAdminUsers === 'function' ? getAdminUsers() : [];
    const professionals = typeof getServiceProfessionals === 'function' ? getServiceProfessionals() : [];
    const list = admins.map((a) => ({ id: `admin:${a.id}`, name: a.name || a.username || 'Administrador', username: a.username || '', email: a.email || '', role: 'Administración' }));
    professionals.filter((p) => p.active !== false).forEach((p) => {
      const name = [p.firstName, p.lastName].filter(Boolean).join(' ').trim() || p.name || p.username || 'Profesional';
      const matched = list.find((a) => a.username && p.username && nameKey(a.username) === nameKey(p.username));
      if (matched) {
        matched.name = name || matched.name;
        matched.email = matched.email || p.email || '';
        matched.role = 'Administración · Profesional';
      } else {
        list.push({ id: `professional:${p.id}`, name, username: p.username || '', email: p.email || '', role: p.profession || 'Profesional' });
      }
    });
    return list;
  }
  function ownerId() {
    const user = typeof getCurrentAdmin === 'function' ? getCurrentAdmin() : null;
    return user ? `admin:${user.id}` : '';
  }
  function save() {
    try { sessionStorage.setItem(storageKey, JSON.stringify(meetings)); return true; }
    catch (_) { return false; }
  }
  function changeMonth(offset) {
    const d = new Date(viewYear, viewMonth + offset, 1);
    viewYear = d.getFullYear(); viewMonth = d.getMonth();
    const day = Math.min(Number(selectedDate.slice(-2)), new Date(viewYear, viewMonth + 1, 0).getDate());
    selectedDate = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
    render();
  }
  function render() {
    const heading = el('[data-video-month]');
    heading.textContent = monthFormat.format(new Date(viewYear, viewMonth, 1));
    const grid = el('[data-video-days]');
    grid.replaceChildren();
    const offset = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
    for (let i = 0; i < offset; i++) {
      const empty = document.createElement('span'); empty.className = 'video-day-empty'; grid.append(empty);
    }
    const total = new Date(viewYear, viewMonth + 1, 0).getDate();
    for (let i = 1; i <= total; i++) {
      const date = `${viewYear}-${pad(viewMonth + 1)}-${pad(i)}`;
      const day = document.createElement('button');
      day.type = 'button'; day.className = 'video-day'; day.textContent = String(i);
      day.setAttribute('aria-label', dayFormat.format(fromKey(date)));
      day.setAttribute('aria-pressed', String(date === selectedDate));
      day.dataset.today = String(date === toKey(new Date()));
      if (meetings.some((meeting) => meeting.date === date)) day.classList.add('has-meetings');
      day.addEventListener('click', () => { selectedDate = date; render(); });
      grid.append(day);
    }
    el('[data-video-agenda-date]').textContent = dayFormat.format(fromKey(selectedDate));
    const agenda = el('[data-video-agenda-list]');
    const dayMeetings = meetings.filter((meeting) => meeting.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time));
    agenda.innerHTML = dayMeetings.length ? dayMeetings.map((meeting) => `
      <button type="button" class="video-agenda-item" data-video-detail="${html(meeting.id)}">
        <span class="video-agenda-time">${html(meeting.time)}</span>
        <span><strong>${html(meeting.title)}</strong><small>Ver detalle → · ${html(meeting.duration)} min</small></span>
      </button>`).join('') : '<p class="video-agenda-empty">No hay reuniones programadas para este día.</p>';
  }
  function openCreate() {
    if (typeof getCurrentAdmin !== 'function' || !getCurrentAdmin()) return;
    const form = el('[data-video-form]'); form.reset();
    form.elements.date.value = selectedDate;
    const current = new Date();
    const rounded = Math.ceil(current.getMinutes() / 15) * 15;
    const recommended = new Date(current.getFullYear(), current.getMonth(), current.getDate(), current.getHours(), rounded);
    form.elements.time.value = selectedDate === toKey(current) ? `${pad(recommended.getHours())}:${pad(recommended.getMinutes())}` : '10:00';
    el('[data-video-message]').textContent = '';
    const people = roster(); const owner = ownerId();
    el('[data-video-participants]').innerHTML = people.length ? people.map((person) => {
      const self = person.id === owner;
      return `<label class="video-participant-row"><input type="checkbox" name="participant" value="${html(person.id)}" ${self ? 'checked disabled' : ''} />
        <span class="video-avatar" aria-hidden="true">${html(person.name.slice(0, 1).toUpperCase())}</span>
        <span class="video-person-text"><strong>${html(person.name)}</strong><small>${html(person.email || 'Correo pendiente de registrar')} · ${html(person.role)}</small></span>
        ${self ? '<span class="video-you">Tú</span>' : ''}</label>`;
    }).join('') : '<p>No hay participantes disponibles.</p>';
    el('[data-video-dialog]').hidden = false;
    form.elements.title.focus();
  }
  function closeCreate() { el('[data-video-dialog]').hidden = true; }
  function openDetail(id) {
    const meeting = meetings.find((m) => m.id === id);
    if (!meeting) return;
    detailId = id;
    el('[data-video-detail-title]').textContent = meeting.title;
    const participants = Array.isArray(meeting.participants) ? meeting.participants : [];
    el('[data-video-detail-content]').innerHTML = `
      <span class="video-preview-status">Reunión de prueba · Sin invitaciones enviadas</span>
      <h3>Fecha y hora</h3><p>${html(dayFormat.format(fromKey(meeting.date)))} · ${html(meeting.time)} · ${html(meeting.duration)} minutos</p>
      <h3>Descripción</h3><p>${html(meeting.description || 'Sin descripción.')}</p>
      <h3>Participantes (${participants.length})</h3><ul>${participants.map((p) => `<li>${html(p.name)}${p.email ? ` · ${html(p.email)}` : ' · correo pendiente'}</li>`).join('')}</ul>
      <h3>Videollamada</h3><p>La sala de LiveKit y el enlace de acceso se habilitarán en la etapa de integración. Aún no se ha enviado ningún correo.</p>`;
    el('[data-video-detail-dialog]').hidden = false;
    el('[data-video-detail-close]').focus();
  }
  function closeDetail() { el('[data-video-detail-dialog]').hidden = true; detailId = null; }

  all('[data-video-new]').forEach((button) => button.addEventListener('click', openCreate));
  all('[data-video-close]').forEach((button) => button.addEventListener('click', closeCreate));
  all('[data-video-detail-close]').forEach((button) => button.addEventListener('click', closeDetail));
  el('[data-video-prev]').addEventListener('click', () => changeMonth(-1));
  el('[data-video-next]').addEventListener('click', () => changeMonth(1));
  el('[data-video-today]').addEventListener('click', () => {
    const today = new Date(); selectedDate = toKey(today); viewYear = today.getFullYear(); viewMonth = today.getMonth(); render();
  });
  el('[data-video-agenda-list]').addEventListener('click', (event) => {
    const button = event.target.closest('[data-video-detail]');
    if (button) openDetail(button.dataset.videoDetail);
  });
  el('[data-video-form]').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const title = String(data.get('title') || '').trim();
    const date = String(data.get('date') || '');
    const time = String(data.get('time') || '');
    const duration = Number(data.get('duration'));
    const message = el('[data-video-message]');
    if (!title || !fromKey(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || ![15,30,45,60,90,120].includes(duration)) {
      message.textContent = 'Revisa el título, la fecha, la hora y la duración.'; return;
    }
    const start = new Date(`${date}T${time}:00`);
    if (Number.isNaN(start.getTime()) || start.getTime() < Date.now() - 60000) {
      message.textContent = 'Selecciona una fecha y hora futuras.'; return;
    }
    const members = roster();
    const chosen = new Set([...form.querySelectorAll('input[name="participant"]:checked')].map((input) => input.value));
    chosen.add(ownerId());
    const participants = members.filter((person) => chosen.has(person.id)).map(({ id, name, email, role }) => ({ id, name, email, role }));
    if (!participants.length) { message.textContent = 'No hay una cuenta organizadora disponible.'; return; }
    const meeting = { id: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, title, description: String(data.get('description') || '').trim(), date, time, duration, participants, createdAt: new Date().toISOString() };
    meetings.push(meeting);
    if (!save()) { meetings.pop(); message.textContent = 'No se pudo guardar esta reunión de prueba en el navegador.'; return; }
    selectedDate = date; const parsed = fromKey(date); viewYear = parsed.getFullYear(); viewMonth = parsed.getMonth();
    closeCreate(); render(); openDetail(meeting.id);
  });
  el('[data-video-delete]').addEventListener('click', () => {
    if (!detailId || !window.confirm('¿Eliminar esta reunión de prueba?')) return;
    const old = meetings;
    meetings = meetings.filter((meeting) => meeting.id !== detailId);
    if (!save()) { meetings = old; window.alert('No fue posible eliminar la reunión en esta sesión.'); return; }
    closeDetail(); render();
  });
  // El cierre con Escape debe cerrar el diálogo, no toda la aplicación administradora.
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!el('[data-video-detail-dialog]').hidden) { event.stopImmediatePropagation(); closeDetail(); }
    else if (!el('[data-video-dialog]').hidden) { event.stopImmediatePropagation(); closeCreate(); }
  }, true);
  // Actualizar calendario al entrar en pestaña y ante cambios a los perfiles existentes.
  document.querySelector('[data-admin-tab="video"]')?.addEventListener('click', render);
  render();
})();
