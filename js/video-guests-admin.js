/* Fase 2: enlaces externos gestionados por el organizador.
 * No se guarda el secreto del enlace en Supabase ni localStorage.
 */
(() => {
  'use strict';
  const root = document.querySelector('[data-admin-view="video"]');
  const panel = root?.querySelector('[data-guest-admin]');
  if (!panel) return;
  const status = panel.querySelector('[data-guest-link-status]');
  const create = panel.querySelector('[data-guest-link-create]');
  const revoke = panel.querySelector('[data-guest-link-revoke]');
  const copy = panel.querySelector('[data-guest-link-copy]');
  const linkInput = panel.querySelector('[data-guest-link-value]');
  let meetingId = null;
  let link = null;
  let busy = false;
  let loadSerial = 0;

  function label(message, error = false) { status.textContent = message; status.dataset.error = String(error); }
  function render(record = null) {
    const active = Boolean(record?.exists && !record.revoked && Date.parse(record.expiresAt) > Date.now());
    create.disabled = busy || active;
    revoke.disabled = busy || !record?.exists;
    revoke.hidden = !record?.exists;
    copy.hidden = !active || !link;
    linkInput.hidden = !active || !link;
    linkInput.value = active && link ? link : '';
    if (!busy) {
      if (active && link) label(`Enlace activo hasta ${new Date(record.expiresAt).toLocaleString('es-CL')}. Copia y compártelo únicamente con tus invitados.`);
      else if (active) label('Existe un enlace activo; por seguridad no puede recuperarse. Revócalo y genera uno nuevo si lo perdiste.');
      else if (record?.exists) label('Enlace revocado o vencido. Por privacidad, usa una reunión nueva si necesitas volver a transcribir.');
      else label('Los invitados podrán utilizar videollamada, chat, pantalla y consentimiento individual de transcripción. No obtendrán acceso a fichas clínicas ni a la administración de actas.');
    }
  }
  let record = null;
  async function request(action) {
    const db = window.domusSupabase;
    const { data: { session }, error } = await db.auth.getSession();
    if (error || !session?.access_token) throw new Error('Vuelve a ingresar a tu cuenta administrativa.');
    const response = await fetch('/api/video-guests', {
      method: 'POST', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ action, meetingId })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Error al gestionar el enlace.');
    return result;
  }
  async function refresh() {
    const id = meetingId;
    const serial = ++loadSerial;
    label('Comprobando enlace de invitados...');
    try {
      const result = await request('status');
      if (serial !== loadSerial || id !== meetingId) return;
      record = result.link; render(record);
    } catch (error) { if (serial === loadSerial && id === meetingId) label(error.message, true); }
  }
  root.addEventListener('domus:meeting-detail', (event) => {
    loadSerial++;
    meetingId = null; link = null; record = null;
    const detail = event.detail || {};
    const authorized = detail.meetingId && detail.organizerId && detail.memberId && detail.organizerId === detail.memberId;
    panel.hidden = !authorized;
    if (authorized) { meetingId = detail.meetingId; render(); void refresh(); }
  });
  create.addEventListener('click', async () => {
    if (!meetingId || busy) return;
    if (!window.confirm('Este enlace permitirá entrar a personas sin cuenta. Solo habrá transcripción si TODOS autorizan; revocar el enlace la detendrá y exigirá una reunión nueva para volver a transcribir. ¿Continuar?')) return;
    busy = true; render(record); label('Generando enlace seguro...');
    try {
      const result = await request('create');
      link = result.link; record = { exists:true, revoked:false, expiresAt:result.expiresAt };
      busy = false; render(record); linkInput.focus(); linkInput.select();
    } catch (error) { busy = false; render(record); label(error.message,true); }
  });
  revoke.addEventListener('click', async () => {
    if (!meetingId || busy || !window.confirm('¿Revocar este enlace y desconectar a quienes hayan entrado por él?')) return;
    busy = true; render(record); label('Revocando enlace y desconectando invitados externos...');
    try {
      const result = await request('revoke');
      link = null; busy = false; record = { ...record, revoked:true };
      render(record); label(`Enlace revocado. Invitados desconectados: ${result.disconnected || 0}.`);
    } catch (error) { busy = false; render(record); label(error.message,true); }
  });
  copy.addEventListener('click', async () => {
    if (!link) return;
    try { await navigator.clipboard.writeText(link); label('Enlace copiado. Compártelo solamente con los invitados autorizados.'); }
    catch (_) { linkInput.focus(); linkInput.select(); label('Selecciona el enlace y cópialo manualmente.'); }
  });
})();
