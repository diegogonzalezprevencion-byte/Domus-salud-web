/* Invitaciones externas Domus Salud. Solo servidor Vercel.
 * Secretos de enlace: aleatorios y SOLO su SHA-256 se almacena en Supabase.
 * Ninguna clave service_role o LiveKit se entrega al navegador.
 */
const crypto = require('node:crypto');
const { AccessToken, RoomServiceClient } = require('livekit-server-sdk');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SECRET = /^[0-9a-f]{64}$/i;
const json = (res, status, body) => res.status(status).json(body);
const hash = (secret) => crypto.createHash('sha256').update(secret).digest('hex');

function configuration() {
  const supabase = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const publishable = process.env.SUPABASE_PUBLISHABLE_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const livekit = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!/^https:\/\/[^\s/]+$/.test(supabase) || !publishable || !service ||
      !/^wss:\/\/[^\s/]+$/.test(livekit) || !apiKey || !apiSecret) {
    throw Object.assign(new Error('Faltan variables de Supabase o LiveKit en Vercel.'), { status: 503 });
  }
  return { supabase, publishable, service, livekit, apiKey, apiSecret };
}

async function rpc(config, name, args) {
  const response = await fetch(`${config.supabase}/rest/v1/rpc/${name}`, {
    method: 'POST', headers: { apikey: config.service, Authorization: `Bearer ${config.service}`,
      'Content-Type': 'application/json' },
    body: JSON.stringify(args), signal: AbortSignal.timeout(12000)
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(response.status === 404 ? 'Falta instalar el SQL de la fase 2.' :
      data?.message || 'Supabase rechazó la operación.');
    error.status = response.status === 404 ? 503 : response.status === 403 ? 403 : 409;
    throw error;
  }
  return data;
}

async function authenticatedUser(req, config) {
  const bearer = /^Bearer (\S+)$/i.exec(String(req.headers.authorization || ''));
  if (!bearer) throw Object.assign(new Error('Debes ingresar como organizador.'), { status: 401 });
  const response = await fetch(`${config.supabase}/auth/v1/user`, {
    headers: { apikey: config.publishable, Authorization: `Bearer ${bearer[1]}` },
    signal: AbortSignal.timeout(10000)
  });
  const user = response.ok ? await response.json().catch(() => null) : null;
  if (!user?.id || !UUID.test(user.id)) {
    throw Object.assign(new Error('Tu sesión venció. Inicia sesión nuevamente.'), { status: 401 });
  }
  return user.id;
}

async function kickLinkGuests(config, meetingId, linkId) {
  const svc = new RoomServiceClient(config.livekit.replace(/^wss:/, 'https:'), config.apiKey, config.apiSecret);
  const roomName = `domus-${meetingId}`;
  let participants;
  try { participants = await svc.listParticipants(roomName); }
  catch (error) {
    // Sala sin crear aún: LiveKit puede devolver NOT_FOUND.
    if (error.code === 5 || /not.?found|does not exist/i.test(error.message || '')) return 0;
    throw error;
  }
  const guests = participants.filter((participant) =>
    typeof participant.identity === 'string' && participant.identity.startsWith(`guest:${linkId}:`));
  await Promise.all(guests.map((participant) => svc.removeParticipant(roomName, participant.identity)));
  return guests.length;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return json(res, 405, { error: 'Método no permitido.' }); }
  let input;
  try { input = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch (_) { return json(res, 400, { error: 'Solicitud inválida.' }); }
  if (!input || typeof input !== 'object') return json(res, 400, { error: 'Solicitud inválida.' });
  const action = input.action;
  if (!['preview','join','status','create','revoke'].includes(action)) return json(res, 400, { error: 'Acción inválida.' });
  try {
    const config = configuration();
    if (action === 'preview' || action === 'join') {
      const secret = input.secret;
      if (typeof secret !== 'string' || !SECRET.test(secret)) return json(res, 404, { error: 'Enlace inválido.' });
      const tokenHash = hash(secret.toLowerCase());
      if (action === 'preview') {
        const meeting = await rpc(config, 'video_guest_link_preview', { p_token_hash: tokenHash });
        return meeting ? json(res, 200, { ok: true, meeting }) : json(res, 404, { error: 'Enlace inexistente, vencido o revocado.' });
      }
      const name = typeof input.name === 'string' ? input.name.trim() : '';
      if (name.length < 2 || name.length > 80 || /[\x00-\x1f\x7f]/.test(name)) {
        return json(res, 400, { error: 'Indica un nombre de 2 a 80 caracteres.' });
      }
      // El link_id NO proviene del cliente: se recupera en el preview validado y se
      // confirma de nuevo de forma atómica en video_guest_join.
      const preview = await rpc(config, 'video_guest_link_preview', { p_token_hash: tokenHash });
      if (!preview) return json(res, 404, { error: 'Enlace inexistente, vencido o revocado.' });
      // El SQL confirma que la parte intermedia de identity coincide con link.id.
      // El ID se obtiene de RPC privilegiada por hash y no se revela al invitado.
      const link = await rpc(config, 'video_guest_link_lookup', { p_token_hash: tokenHash });
      if (!link?.id) return json(res, 404, { error: 'Enlace inexistente, vencido o revocado.' });
      const guestIdentity = `guest:${link.id}:${crypto.randomUUID()}`;
      const meeting = await rpc(config, 'video_guest_join', {
        p_token_hash: tokenHash, p_identity: guestIdentity, p_display_name: name
      });
      if (!meeting?.meetingId || !UUID.test(meeting.meetingId) || meeting.identity !== guestIdentity) {
        return json(res, 403, { error: 'No se puede ingresar. Revisa el horario y la vigencia del enlace.' });
      }
      const jwt = new AccessToken(config.apiKey, config.apiSecret,
        { identity: guestIdentity, name: meeting.name, ttl: '30s' });
      // Valores enum TrackSource de protocolo LiveKit: CAMERA=1; MICROPHONE=2.
      // El servidor impide publicar pantalla: invitados solo tienen cámara y micrófono.
      jwt.addGrant({ roomJoin: true, room: `domus-${meeting.meetingId}`,
        canPublish: true, canPublishSources: [1,2], canSubscribe: true, canPublishData: false });
      const token = await jwt.toJwt();
      // Reducir ventana de carrera con una revocación producida tras video_guest_join.
      const finalCheck = await rpc(config, 'video_guest_link_preview', { p_token_hash: tokenHash });
      if (!finalCheck) return json(res, 403, { error: 'El organizador revocó el enlace.' });
      return json(res, 200, { ok: true, token, url: config.livekit, title: meeting.title });
    }
    const meetingId = input.meetingId;
    if (typeof meetingId !== 'string' || !UUID.test(meetingId)) return json(res, 400, { error: 'Reunión inválida.' });
    const actor = await authenticatedUser(req, config);
    const status = await rpc(config, 'video_guest_link_status', { p_meeting_id: meetingId, p_actor: actor });
    if (action === 'status') return json(res, 200, { ok: true, link: status });
    if (action === 'revoke') {
      const result = await rpc(config, 'video_guest_link_revoke', { p_meeting_id: meetingId, p_actor: actor });
      if (!result?.exists) return json(res, 200, { ok: true, revoked: false, disconnected: 0 });
      try {
        const disconnected = await kickLinkGuests(config, meetingId, result.id);
        return json(res, 200, { ok: true, revoked: true, disconnected });
      } catch (error) {
        console.error('Revocación de invitación: no se confirmó la expulsión LiveKit:', error.message);
        return json(res, 503, { error: 'Enlace revocado para nuevos ingresos, pero no se pudo confirmar la desconexión. Reintenta «Revocar enlace».' });
      }
    }
    if (status?.exists && !status.revoked && Date.parse(status.expiresAt) > Date.now()) {
      return json(res, 409, { error: 'Ya hay un enlace activo. Si perdiste su dirección, revócalo y crea otro.' });
    }
    if (status?.exists && status.id) {
      try { await kickLinkGuests(config, meetingId, status.id); }
      catch (_) { return json(res, 503, { error: 'No se pudo comprobar que los invitados del enlace anterior hayan salido. Reintenta la revocación.' }); }
    }
    const site = process.env.PUBLIC_SITE_URL;
    let origin;
    try { const parsed = new URL(site); if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error('HTTPS'); origin = parsed.origin; }
    catch (_) { return json(res, 503, { error: 'Configura PUBLIC_SITE_URL con el dominio HTTPS público en Vercel.' }); }
    const secret = crypto.randomBytes(32).toString('hex');
    const result = await rpc(config, 'video_guest_link_create', {
      p_meeting_id: meetingId, p_actor: actor, p_token_hash: hash(secret)
    });
    return json(res, 200, { ok: true, expiresAt: result.expiresAt,
      link: `${origin}/invitado#token=${secret}` });
  } catch (error) {
    console.error('Invitados externos:', error.status || 500, error.message);
    return json(res, error.status || 500, { error: error.status && error.status < 500 ? error.message :
      error.status === 503 ? error.message : 'No se pudo procesar la invitación. Intenta nuevamente.' });
  }
};
