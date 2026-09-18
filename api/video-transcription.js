/* Domus Salud: despacho privado de transcripción con consentimiento en Supabase.
 * La clave de servicio nunca se envía al navegador. No inicie agentes desde tokens LiveKit.
 */
const { AgentDispatchClient } = require('livekit-server-sdk');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const json = (res, code, value) => res.status(code).json(value);
const agentName = 'domus-transcriptor';

async function readResponse(response) {
  const raw = await response.text();
  try { return JSON.parse(raw); } catch (_) { return null; }
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Método no permitido.' });
  }
  const supabaseUrl = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const publicKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const liveUrl = process.env.LIVEKIT_URL;
  const liveKey = process.env.LIVEKIT_API_KEY;
  const liveSecret = process.env.LIVEKIT_API_SECRET;
  if (!/^https:\/\/[^\s/]+$/.test(supabaseUrl) || !publicKey) {
    return json(res, 503, { error: 'Falta configurar Supabase en Vercel.' });
  }
  const bearer = /^Bearer (\S+)$/i.exec(String(req.headers.authorization || ''));
  if (!bearer) return json(res, 401, { error: 'Debes iniciar sesión con Supabase Auth.' });
  let input;
  try { input = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch (_) { return json(res, 400, { error: 'Solicitud inválida.' }); }
  const meetingId = input?.meetingId;
  const action = input?.action;
  if (typeof meetingId !== 'string' || !UUID.test(meetingId) || !['start','stop'].includes(action)) {
    return json(res, 400, { error: 'Reunión o acción inválida.' });
  }
  const userHeaders = {
    apikey: publicKey,
    Authorization: `Bearer ${bearer[1]}`,
    'Content-Type': 'application/json'
  };
  const rpc = async (name, data, privileged = false) => {
    const key = privileged ? serviceKey : null;
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: privileged ? { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' } : userHeaders,
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(12000)
    });
    const body = await readResponse(response);
    if (!response.ok) {
      const error = new Error(response.status === 404
        ? 'Falta ejecutar el SQL de control de transcripción.'
        : body?.message || 'La base de datos rechazó la solicitud.');
      error.status = response.status;
      throw error;
    }
    return body;
  };
  try {
    // Comprobar el token en el servicio Auth, no confiar en nombres enviados por el frontend.
    const auth = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: publicKey, Authorization: `Bearer ${bearer[1]}` },
      signal: AbortSignal.timeout(10000)
    });
    const user = auth.ok ? await readResponse(auth) : null;
    if (!user?.id || !UUID.test(user.id)) return json(res, 401, { error: 'Sesión caducada o inválida.' });
    // Ambas RPC comprueban en la base la identidad y la pertenencia a la reunión.
    if (action === 'start') {
      if (process.env.DOMUS_TRANSCRIPTION_ENABLED !== 'true') {
        return json(res, 503, { error: 'Transcripción aún no activada. Falta desplegar y configurar el agente.' });
      }
      if (!serviceKey || !liveUrl || !liveKey || !liveSecret) {
        return json(res, 503, { error: 'Faltan las credenciales privadas de transcripción en Vercel.' });
      }
      const runId = await rpc('video_transcription_begin', { p_meeting_id: meetingId });
      if (typeof runId !== 'string' || !UUID.test(runId)) throw new Error('Supabase no devolvió una sesión válida.');
      const client = new AgentDispatchClient(liveUrl.replace(/^wss:/, 'https:'), liveKey, liveSecret);
      const room = `domus-${meetingId}`;
      let dispatch = null;
      try {
        dispatch = await client.createDispatch(room, agentName, {
          metadata: JSON.stringify({ meetingId, runId })
        });
        if (!dispatch?.id) throw new Error('LiveKit no confirmó el despacho del agente.');
        const confirmed = await rpc('video_transcription_confirm', {
          p_meeting_id: meetingId, p_run_id: runId, p_dispatch_id: dispatch.id
        }, true);
        if (confirmed !== true) {
          await client.deleteDispatch(dispatch.id, room).catch(() => {});
          return json(res, 409, { error: 'Se retiró un consentimiento durante la activación. No se iniciará la transcripción.' });
        }
        return json(res, 200, { ok: true, status: 'active', message: 'Despacho solicitado. Espera a que el agente se conecte.' });
      } catch (error) {
        if (dispatch?.id) await client.deleteDispatch(dispatch.id, room).catch(() => {});
        await rpc('video_transcription_stop', { p_meeting_id: meetingId }).catch(() => {});
        throw error;
      }
    }
    // STOP: la RPC desautoriza la captura de inmediato, aun cuando LiveKit no responda.
    const dispatchId = await rpc('video_transcription_stop', { p_meeting_id: meetingId });
    let warning = null;
    if (dispatchId) {
      if (!liveUrl || !liveKey || !liveSecret) warning = 'Detenido en Supabase; faltan credenciales para retirar el despacho de LiveKit.';
      else {
        try {
          const client = new AgentDispatchClient(liveUrl.replace(/^wss:/, 'https:'), liveKey, liveSecret);
          await client.deleteDispatch(dispatchId, `domus-${meetingId}`);
        } catch (_) {
          warning = 'Detenido en Supabase. El agente debe desconectarse al comprobar el estado.';
        }
      }
    }
    return json(res, 200, { ok: true, status: 'stopped', warning });
  } catch (error) {
    console.error('Error en control de transcripción:', error?.message || 'desconocido');
    const status = [400,401,403,404,409].includes(error.status) ? error.status : 500;
    return json(res, status, { error: status === 500
      ? 'No se pudo completar el control de transcripción. Comprueba el agente y los registros de Vercel.'
      : error.message });
  }
};
