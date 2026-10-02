/* Domus Salud · Acta colaborativa dentro de la videollamada.
 * Cualquier participante autenticado puede redactar y guardar el borrador.
 * La aprobación continúa reservada a administración desde el módulo de actas.
 */
(() => {
  'use strict';
  const root = document.querySelector('[data-video-call]');
  if (!root) return;
  const $ = (selector) => root.querySelector(selector);
  const panel = $('[data-video-live-minutes]');
  const toggle = $('[data-video-minutes-live-toggle]');
  const close = $('[data-video-live-minutes-close]');
  const form = $('[data-video-live-minutes-form]');
  const status = $('[data-video-live-minutes-state]');
  const badge = $('[data-video-live-minutes-badge]');
  const save = $('[data-video-live-minutes-save]');
  const refresh = $('[data-video-live-minutes-refresh]');
  const stage = $('[data-video-call-main]');
  const fields = ['summary','topics','agreements','commitments','pending','notes'];
  let current = null;
  let busy = false;

  function message(text, error = false) {
    status.textContent = text;
    status.dataset.error = String(error);
  }
  function setOpen(open) {
    if (open) {
      window.DomusVideoChat?.hide();
      window.DomusTranscription?.hide();
    }
    panel.hidden = !open;
    toggle.textContent = open ? 'Ocultar acta' : 'Redactar acta';
    toggle.setAttribute('aria-expanded', String(open));
    stage.dataset.minutesOpen = String(open);
    stage.dataset.chatOpen = String(open || !root.querySelector('[data-video-chat]')?.hidden || !root.querySelector('[data-video-transcript]')?.hidden);
  }
  function fill(row) {
    for (const key of fields) form.elements[key].value = row?.[key] || '';
    const approved = row?.status === 'approved';
    badge.textContent = approved ? 'ACTA APROBADA' : `BORRADOR · REV. ${row?.revision || 1}`;
    badge.dataset.status = approved ? 'approved' : 'draft';
    for (const key of fields) form.elements[key].readOnly = approved || busy;
    save.disabled = approved || busy;
    refresh.disabled = busy;
    message(approved ? 'El acta ya fue aprobada y quedó bloqueada.' : 'Borrador colaborativo. Guarda tus cambios antes de cerrar el panel.');
  }
  async function load(createIfMissing = false) {
    const session = current;
    if (!session || busy) return;
    busy = true;
    message(createIfMissing ? 'Abriendo borrador de acta...' : 'Actualizando acta...');
    try {
      let query = await session.db.from('video_meeting_minutes').select('*').eq('meeting_id', session.meeting.id).maybeSingle();
      if (query.error) throw query.error;
      if (!query.data && createIfMissing) {
        const created = await session.db.rpc('video_minutes_create_template', {
          p_meeting_id: session.meeting.id,
          p_replace_draft: false,
          p_expected_revision: null
        });
        if (created.error) throw created.error;
        query = await session.db.from('video_meeting_minutes').select('*').eq('meeting_id', session.meeting.id).maybeSingle();
        if (query.error) throw query.error;
      }
      if (session !== current) return;
      if (!query.data) throw new Error('No se pudo crear el borrador del acta.');
      session.minutes = query.data;
      fill(session.minutes);
    } catch (error) {
      message(`Acta: ${error.message || 'no disponible'}`, true);
    } finally {
      busy = false;
      if (session === current && session.minutes) fill(session.minutes);
    }
  }
  async function open() {
    if (!current) return;
    setOpen(true);
    if (!current.minutes) await load(true);
    else fill(current.minutes);
  }
  async function saveDraft(event) {
    event.preventDefault();
    const session = current;
    if (!session?.minutes || session.minutes.status !== 'draft' || busy) return;
    busy = true;
    save.disabled = true;
    message('Guardando acta en Supabase...');
    const values = Object.fromEntries(fields.map((key) => [key, form.elements[key].value]));
    try {
      const result = await session.db.rpc('video_minutes_save', {
        p_meeting_id: session.meeting.id,
        p_summary: values.summary,
        p_topics: values.topics,
        p_agreements: values.agreements,
        p_commitments: values.commitments,
        p_pending: values.pending,
        p_notes: values.notes,
        p_revision: session.minutes.revision
      });
      if (result.error || !Number.isInteger(result.data)) throw result.error || new Error('Supabase no confirmó el guardado.');
      await load(false);
      message(`Acta guardada correctamente · revisión ${result.data}.`);
    } catch (error) {
      message(`No se guardó: ${error.message || 'error de conexión'}. Actualiza para comprobar si otra persona editó el acta.`, true);
    } finally {
      busy = false;
      if (session === current && session.minutes) fill(session.minutes);
    }
  }
  function start(meeting, db, member) {
    current = { meeting, db, member, minutes: null };
    busy = false;
    form.reset();
    toggle.disabled = false;
    setOpen(false);
    badge.textContent = 'BORRADOR';
    message('Presiona «Redactar acta» para abrir el borrador compartido.');
  }
  function stop() {
    current = null;
    busy = false;
    form.reset();
    panel.hidden = true;
    toggle.disabled = true;
    toggle.textContent = 'Redactar acta';
    toggle.setAttribute('aria-expanded', 'false');
    stage.dataset.minutesOpen = 'false';
  }
  toggle.addEventListener('click', () => panel.hidden ? void open() : setOpen(false));
  close.addEventListener('click', () => setOpen(false));
  refresh.addEventListener('click', () => void load(false));
  form.addEventListener('submit', (event) => void saveDraft(event));
  stop();
  window.DomusLiveMinutes = { start, stop, hide: () => setOpen(false) };
})();
