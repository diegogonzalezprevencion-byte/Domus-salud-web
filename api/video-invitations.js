/* Domus Salud · envío de invitaciones desde Vercel.
 * JWT del organizador validado con Supabase Auth; service_role SOLO se usa en servidor.
 * El cliente nunca aporta los destinatarios, organizador, título ni enlace: se obtienen de Supabase.
 */
const nodemailer = require('nodemailer');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const json = (res, status, body) => res.status(status).json(body);
const html = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const timeout = () => AbortSignal.timeout(10000);

function settings() {
  const supabaseUrl = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const publicKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const site = process.env.PUBLIC_SITE_URL;
  const sender = process.env.VIDEO_EMAIL_FROM || process.env.SMTP_USER;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || '465');
  const secure = String(process.env.SMTP_SECURE ?? (port === 465)).toLowerCase() === 'true';
  if (!/^https:\/\/[^\s/]+$/.test(supabaseUrl) || !publicKey || !serviceKey) throw new Error('Supabase de servidor sin configurar');
  if (!site || !/^https:\/\/[^\s?#]+\/?$/.test(site) || new URL(site).hostname === 'localhost') throw new Error('PUBLIC_SITE_URL debe ser la URL pública HTTPS');
  if (!host || !process.env.SMTP_USER || !process.env.SMTP_PASS || !EMAIL.test(sender) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Configura SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS y VIDEO_EMAIL_FROM');
  }
  return { supabaseUrl, publicKey, serviceKey, site: site.replace(/\/$/, ''), sender, host, port, secure };
}

function authHeaders(key, bearer) {
  return { apikey: key, Authorization: `Bearer ${bearer || key}` };
}

async function request(url, options = {}) {
  const response = await fetch(url, { ...options, signal: timeout() });
  if (!response.ok) {
    // Nunca retornar credenciales ni error SMTP al cliente.
    throw new Error(`Error de Supabase (${response.status}) en ${new URL(url).pathname}`);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : [];
}

function client(config, endpoint, params, options = {}) {
  const uri = `${config.supabaseUrl}/rest/v1/${endpoint}${params ? `?${params}` : ''}`;
  const { headers: extraHeaders, ...rest } = options;
  return request(uri, {
    ...rest,
    headers: { ...authHeaders(config.serviceKey), ...extraHeaders }
  });
}

function findRows(config, table, query) {
  return client(config, table, new URLSearchParams(query).toString());
}

function calendarTime(startsAt, timezone) {
  let zone = 'America/Santiago';
  try { new Intl.DateTimeFormat('es-CL', { timeZone: timezone }); zone = timezone; } catch (_) {}
  return new Intl.DateTimeFormat('es-CL', { timeZone: zone, dateStyle: 'full', timeStyle: 'short' }).format(new Date(startsAt));
}

async function setStatus(config, claim, meetingId, status, errorMessage = null) {
  await client(config, 'video_email_outbox', new URLSearchParams({ id: `eq.${claim.outbox_id}`, status: 'eq.sending' }).toString(), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ status, last_error: errorMessage?.slice(0, 300) ?? null, sent_at: status === 'sent' ? new Date().toISOString() : null })
  });
  await client(config, 'video_meeting_participants', new URLSearchParams({ meeting_id: `eq.${meetingId}`, member_id: `eq.${claim.member_id}` }).toString(), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ email_status: status })
  });
}

function message(config, meeting, organizer, person, recipient) {
  const when = calendarTime(meeting.starts_at, meeting.timezone);
  const link = `${config.site}/?reunion=${encodeURIComponent(meeting.id)}`;
  const name = person?.display_name || 'integrante del equipo';
  const accessNote = person?.role === 'professional'
    ? 'El acceso directo de profesionales a la sala aún no está habilitado. Coordina tu ingreso con la persona organizadora; no uses credenciales de otro usuario.'
    : 'Ingresa con tu propia cuenta de Domus Salud y abre Administrador → Video llamadas. El acceso se habilita 15 minutos antes del inicio.';
  const own = person?.id === organizer?.id;
  const intro = own ? 'Tu reunión de Domus Salud quedó programada.' : 'Te han invitado a una reunión de Domus Salud.';
  const heading = own ? 'Confirmación de reunión programada' : 'Invitación a reunión';
  const text = [
    `Hola ${name}:`, '', intro,
    `Reunión: ${meeting.title}`, `Fecha y hora: ${when}`, `Duración: ${meeting.duration_minutes} minutos`,
    `Organiza: ${organizer?.display_name || 'Administración Domus Salud'}`, '', `Consulta la reunión: ${link}`, '', accessNote,
    '', 'Este correo es una notificación automática. No compartas tus claves de acceso.'
  ].join('\n');
  const emailHtml = `<div style="font-family:Arial,sans-serif;max-width:650px;color:#213943;line-height:1.6">
    <div style="background:#063d65;color:#fff;padding:22px;border-radius:14px 14px 0 0"><h1 style="font-size:22px;margin:0">${html(heading)}</h1><span>Domus Salud</span></div>
    <div style="padding:22px;border:1px solid #deeaec;border-radius:0 0 14px 14px">
    <p>Hola <strong>${html(name)}</strong>:</p><p>${html(intro)}</p>
    <p><strong>Reunión:</strong> ${html(meeting.title)}<br><strong>Fecha y hora:</strong> ${html(when)}<br><strong>Duración:</strong> ${meeting.duration_minutes} minutos<br><strong>Organiza:</strong> ${html(organizer?.display_name || 'Administración Domus Salud')}</p>
    <p><a href="${html(link)}" style="background:#147a80;color:white;padding:11px 18px;border-radius:9px;display:inline-block;text-decoration:none">Ver reunión en Domus Salud</a></p>
    <p style="font-size:13px">${html(accessNote)}</p><p style="font-size:12px;color:#6a808b">No compartas tus credenciales.</p>
    </div></div>`;
  return { from: `Domus Salud <${config.sender}>`, to: recipient, replyTo: config.sender,
    subject: `${own ? "Confirmación Domus Salud" : "Invitación Domus Salud"}: ${meeting.title}`.slice(0, 170), text, html: emailHtml,
    messageId: `<domus-invite-${meeting.id}-${claimSafeId(person?.id || recipient)}@domusalud.cl>` };
}
function claimSafeId(id) { return String(id).replace(/[^a-zA-Z0-9-]/g, '-').slice(0, 90); }

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return json(res, 405, { error: 'Método no permitido.' }); }
  const bearer = /^Bearer (\S+)$/i.exec(String(req.headers.authorization || ''));
  if (!bearer) return json(res, 401, { error: 'Inicia sesión para enviar invitaciones.' });
  let meetingId;
  try { meetingId = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body)?.meetingId; }
  catch (_) { return json(res, 400, { error: 'Datos inválidos.' }); }
  if (typeof meetingId !== 'string' || !UUID.test(meetingId)) return json(res, 400, { error: 'Identificador inválido.' });
  let config;
  try { config = settings(); }
  catch (error) { console.error('Correo de reuniones sin configurar:', error.message); return json(res, 503, { error: 'El envío de correos no está configurado en Vercel. La reunión permanece guardada; configura SMTP y reintenta.' }); }
  try {
    // Validación real de token, independiente del ID recibido por el navegador.
    const userResponse = await request(`${config.supabaseUrl}/auth/v1/user`, {
      headers: authHeaders(config.publicKey, bearer[1])
    });
    if (!userResponse.id || !UUID.test(userResponse.id)) return json(res, 401, { error: 'Sesión inválida.' });
    const [person] = await findRows(config, 'video_members', { select: 'id,role,active', auth_user_id: `eq.${userResponse.id}`, limit: '1' });
    if (!person?.active || person.role !== 'admin') return json(res, 403, { error: 'Esta cuenta no es un administrador activo.' });
    const [meeting] = await findRows(config, 'video_meetings', { select: 'id,organizer_id,title,starts_at,timezone,duration_minutes,status', id: `eq.${meetingId}`, limit: '1' });
    if (!meeting) return json(res, 404, { error: 'Reunión no encontrada.' });
    if (meeting.organizer_id !== person.id) return json(res, 403, { error: 'Solo quien organizó esta reunión puede enviar sus invitaciones.' });
    if (meeting.status !== 'scheduled') return json(res, 409, { error: 'No se envían invitaciones de reuniones canceladas.' });
    const [organizer] = await findRows(config, 'video_members', { select: 'id,display_name', id: `eq.${person.id}`, limit: '1' });
    const invited = await findRows(config, 'video_meeting_participants', {
      select: 'member_id,participation_status,email_status', meeting_id: `eq.${meetingId}`
    });
    const memberIds = invited.map((p) => p.member_id).filter(Boolean);
    const allMembers = memberIds.length ? await findRows(config, 'video_members', {
      select: 'id,display_name,role,email', id: `in.(${memberIds.map((id) => `"${id.replaceAll('"', '')}"`).join(',')})`
    }) : [];
    const names = new Map(allMembers.map((p) => [p.id, p]));
    const missing = invited.filter((p) => !EMAIL.test(names.get(p.member_id)?.email || '')).length;
    // Sólo la base de datos decide qué filas se pueden reclamar y evita envíos simultáneos.
    const claimed = await client(config, 'rpc/video_claim_pending_invitations', '', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_meeting_id: meetingId })
    });
    let sentNow = 0, failedNow = 0;
    const transporter = nodemailer.createTransport({
      host: config.host, port: config.port, secure: config.secure,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
      pool: true, maxConnections: 3
    });
    try {
      // Concurrencia limitada y estados individuales para no bloquear al resto si un correo falla.
      for (let offset = 0; offset < claimed.length; offset += 3) {
        await Promise.all(claimed.slice(offset, offset + 3).map(async (claim) => {
          try {
            if (!EMAIL.test(claim.recipient_email)) throw new Error('Destinatario sin correo válido');
            await transporter.sendMail(message(config, meeting, organizer, names.get(claim.member_id), claim.recipient_email));
            await setStatus(config, claim, meetingId, 'sent');
            sentNow++;
          } catch (error) {
            failedNow++;
            console.error('Invitación fallida:', { meetingId, outboxId: claim.outbox_id, message: error.message });
            try { await setStatus(config, claim, meetingId, 'failed', 'No se pudo entregar al servidor de correo; reintentar desde el detalle.'); }
            catch (stateError) { console.error('No se pudo registrar el estado del envío:', stateError.message); }
          }
        }));
      }
    } finally { transporter.close(); }
    const allOutbox = await findRows(config, 'video_email_outbox', {
      select: 'id,status', meeting_id: `eq.${meetingId}`, event_type: 'eq.invitation'
    });
    const sentTotal = allOutbox.filter((row) => row.status === 'sent').length;
    const pending = allOutbox.filter((row) => row.status !== 'sent').length;
    return json(res, 200, { ok: pending === 0 && missing === 0,
      sentNow, failedNow, sentTotal, pending, missing,
      message: pending || missing ? 'Reunión guardada. Hay invitaciones pendientes o sin correo; puedes reintentar desde el detalle.' : 'Invitaciones aceptadas por el servidor de correo.' });
  } catch (error) {
    console.error('Error al procesar invitaciones:', error.message);
    return json(res, error.message.includes('/auth/v1/user') ? 401 : 500, {
      error: 'No fue posible procesar las invitaciones. La reunión sigue guardada en Supabase; reintenta desde su detalle.'
    });
  }
};
