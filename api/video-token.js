/* Solo servidor (Vercel). Nunca exponer LIVEKIT_API_SECRET al navegador. */
const { AccessToken } = require('livekit-server-sdk');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const json = (res, status, body) => res.status(status).json(body);

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Método no permitido' });
  }
  const host = process.env.LIVEKIT_URL;
  const key = process.env.LIVEKIT_API_KEY;
  const secret = process.env.LIVEKIT_API_SECRET;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!host || !key || !secret || !supabaseUrl || !supabaseKey) {
    return json(res, 503, { error: 'Faltan variables LIVEKIT_* o SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY en Vercel.' });
  }
  if (!/^wss:\/\/[^\s/]+$/.test(host) || !/^https:\/\/[^\s/]+$/.test(supabaseUrl)) {
    return json(res, 503, { error: 'URL del servidor mal configurada.' });
  }
  const bearer = /^Bearer (\S+)$/i.exec(String(req.headers.authorization || ''));
  if (!bearer) return json(res, 401, { error: 'Inicia sesión con Supabase Auth para ingresar.' });
  let meetingId;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    meetingId = body?.meetingId;
  } catch (_) { return json(res, 400, { error: 'Solicitud inválida.' }); }
  if (typeof meetingId !== 'string' || !UUID.test(meetingId)) {
    return json(res, 400, { error: 'Identificador de reunión inválido.' });
  }
  try {
    // Validación real de JWT contra Supabase Auth (nunca confiar en un ID enviado por el cliente).
    const authResp = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${bearer[1]}` },
      signal: AbortSignal.timeout(10000)
    });
    if (!authResp.ok) return json(res, 401, { error: 'Sesión no válida o vencida. Vuelve a iniciar sesión.' });
    const user = await authResp.json();
    if (!user?.id || !UUID.test(user.id)) return json(res, 401, { error: 'Usuario no válido.' });
    // Consultas con JWT del usuario: RLS sigue aplicada. Ninguna service_role key aquí.
    const headers = { apikey: supabaseKey, Authorization: `Bearer ${bearer[1]}` };
    const getRows = async (resource, params) => {
      const response = await fetch(`${supabaseUrl}/rest/v1/${resource}?${params.toString()}`, {
        headers, signal: AbortSignal.timeout(10000)
      });
      if (!response.ok) throw new Error(`No se pudo consultar ${resource} (${response.status}).`);
      return response.json();
    };
    const memberQuery = new URLSearchParams({ select: 'id,display_name,role,active', auth_user_id: `eq.${user.id}`, limit: '1' });
    const members = await getRows('video_members', memberQuery);
    const member = members[0];
    if (!member?.active) return json(res, 403, { error: 'Esta cuenta no está vinculada a un miembro activo.' });
    const meetingQuery = new URLSearchParams({ select: 'id,starts_at,duration_minutes,status', id: `eq.${meetingId}`, limit: '1' });
    const meetings = await getRows('video_meetings', meetingQuery);
    const meeting = meetings[0];
    if (!meeting || meeting.status !== 'scheduled') return json(res, 404, { error: 'La reunión no existe o fue cancelada.' });
    const participantQuery = new URLSearchParams({ select: 'member_id', meeting_id: `eq.${meetingId}`, member_id: `eq.${member.id}`, limit: '1' });
    const participant = await getRows('video_meeting_participants', participantQuery);
    if (!participant.length) return json(res, 403, { error: 'No estás invitado a esta reunión.' });
    const start = Date.parse(meeting.starts_at);
    const end = start + meeting.duration_minutes * 60000;
    const current = Date.now();
    if (!Number.isFinite(start) || current < start - 15 * 60000 || current > end + 15 * 60000) {
      return json(res, 403, { error: 'Podrás ingresar desde 15 minutos antes y hasta 15 minutos después del horario de término.' });
    }
    // ID y sala opacos, sin nombres/correos en logs de LiveKit.
    const token = new AccessToken(key, secret, {
      identity: user.id, name: member.display_name, ttl: '20m'
    });
    token.addGrant({ roomJoin: true, room: `domus-${meetingId}`, canPublish: true, canSubscribe: true, canPublishData: true });
    return json(res, 200, { url: host, token: await token.toJwt() });
  } catch (error) {
    console.error('No fue posible emitir un token LiveKit:', error.message);
    return json(res, 500, { error: 'No se pudo preparar la videollamada. Intenta nuevamente.' });
  }
};
