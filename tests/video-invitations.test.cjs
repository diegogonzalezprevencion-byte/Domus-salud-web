const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../api/video-invitations.js'), 'utf8');
const calendar = fs.readFileSync(path.join(__dirname, '../js/video-calendar.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const sql = fs.readFileSync(path.join(__dirname, '../supabase/2026-09-18-invitaciones-email.sql'), 'utf8');
const meetingId = '22222222-2222-4222-8222-222222222222';
const userId = '11111111-1111-4111-8111-111111111111';
const outboxId = '33333333-3333-4333-8333-333333333333';
const organizerOutboxId = '44444444-4444-4444-8444-444444444444';
const organizerId = 'admin:admin-dgonzalez';
const inviteeId = 'admin:admin-cmeza';
const config = {
  SUPABASE_URL: 'https://domus-example.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_TEST',
  SUPABASE_SERVICE_ROLE_KEY: 'SERVICE_ROLE_PRIVATE_TEST',
  SMTP_HOST: 'mail.example.org', SMTP_PORT: '465', SMTP_SECURE: 'true',
  SMTP_USER: 'contacto@domusalud.cl', SMTP_PASS: 'fake-secret',
  VIDEO_EMAIL_FROM: 'contacto@domusalud.cl', PUBLIC_SITE_URL: 'https://domusalud.cl'
};
function harness({ foreign = false, failedSmtp = false, alreadySent = false, missingEmail = false, includeOrganizer = false, env = config } = {}) {
  const calls = [], sentMail = [];
  let smtpFail = failedSmtp;
  let status = alreadySent ? 'sent' : 'awaiting_email_setup';
  let organizerStatus = alreadySent ? 'sent' : 'awaiting_email_setup';
  let participantStatus = alreadySent ? 'sent' : (missingEmail ? 'missing_email' : 'not_configured');
  let claimedTimes = 0;
  const meetings = [{ id: meetingId, organizer_id: organizerId, title: 'Reunión de equipo', status: 'scheduled',
    starts_at: '2026-09-25T14:00:00Z', duration_minutes: 60, timezone: 'America/Santiago' }];
  const members = [
    { id: organizerId, role: 'admin', active: true, auth_user_id: userId, display_name: 'Diego', email: 'dgonzalez@domusalud.cl' },
    { id: inviteeId, role: 'admin', active: true, display_name: 'Catalina', email: missingEmail ? null : 'cmeza@domusalud.cl' }
  ];
  const rows = [{ meeting_id: meetingId, member_id: organizerId, participation_status: 'organizer', email_status: includeOrganizer ? 'not_configured' : 'not_applicable' },
    { meeting_id: meetingId, member_id: inviteeId, participation_status: 'invited', email_status: participantStatus }];
  const fetchMock = async (url, options = {}) => {
    const u = new URL(url);
    calls.push({ pathname: u.pathname, method: options.method || 'GET', headers: options.headers, body: options.body });
    const authorized = options.headers?.Authorization || '';
    const privateRequest = u.pathname !== '/auth/v1/user';
    if (privateRequest) assert.equal(authorized, `Bearer ${config.SUPABASE_SERVICE_ROLE_KEY}`);
    else assert.equal(authorized, 'Bearer real-jwt');
    let data = [];
    if (u.pathname === '/auth/v1/user') data = { id: userId };
    else if (u.pathname.endsWith('/video_members')) {
      if (u.searchParams.has('auth_user_id')) data = [foreign ? { ...members[0], id: inviteeId } : members[0]];
      else if (u.searchParams.has('id') && u.searchParams.get('id').startsWith('eq.')) data = [members[0]];
      else data = members;
    } else if (u.pathname.endsWith('/video_meetings')) data = meetings;
    else if (u.pathname.endsWith('/video_meeting_participants')) {
      if (options.method === 'PATCH') {
        const id = u.searchParams.get('member_id')?.replace(/^eq\./, '');
        const row = rows.find((entry) => entry.member_id === id);
        if (row) row.email_status = JSON.parse(options.body).email_status;
      }
      else data = rows;
    } else if (u.pathname.endsWith('/rpc/video_claim_pending_invitations')) {
      claimedTimes++;
      if (includeOrganizer && organizerStatus !== 'sent' && organizerStatus !== 'sending') {
        organizerStatus = 'sending';
        data.push({ outbox_id: organizerOutboxId, member_id: organizerId, recipient_email: 'dgonzalez@domusalud.cl' });
      }
      if (!missingEmail && status !== 'sent' && status !== 'sending') {
        status = 'sending';
        data.push({ outbox_id: outboxId, member_id: inviteeId, recipient_email: 'cmeza@domusalud.cl' });
      }
    } else if (u.pathname.endsWith('/video_email_outbox')) {
      if (options.method === 'PATCH') {
        const id = u.searchParams.get('id')?.replace(/^eq\./, '');
        if (id === organizerOutboxId) organizerStatus = JSON.parse(options.body).status;
        else status = JSON.parse(options.body).status;
      } else {
        if (includeOrganizer) data.push({ id: organizerOutboxId, status: organizerStatus });
        if (!missingEmail) data.push({ id: outboxId, status });
      }
    } else throw new Error(`Unexpected URL: ${url}`);
    return { ok: true, status: 200, async text() { return JSON.stringify(data); } };
  };
  const mailer = { createTransport(options) {
    assert.equal(options.auth.pass, config.SMTP_PASS);
    return { async sendMail(mail) { sentMail.push(mail); if (smtpFail) throw new Error('SMTP offline'); return { accepted: [mail.to] }; }, close() {} };
  }};
  const sandbox = { require(name) { assert.equal(name, 'nodemailer'); return mailer; },
    module: { exports: {} }, process: { env }, fetch: fetchMock,
    URL, URLSearchParams, AbortSignal, Date, Intl, Number, String, Map, JSON,
    console: { error() {} }
  };
  vm.runInNewContext(source, sandbox, { filename: 'video-invitations.js' });
  const req = { method: 'POST', headers: { authorization: 'Bearer real-jwt' }, body: { meetingId } };
  const res = { headers: {}, setHeader(key, value) { this.headers[key] = value; }, status(code) { this.statusCode = code; return this; },
    json(body) { this.body = JSON.parse(JSON.stringify(body)); return this; } };
  return { req, res, handler: sandbox.module.exports, calls, sentMail, get status() { return status; }, get claimedTimes() { return claimedTimes; }, setFailure(v) { smtpFail = v; } };
}

test('Calendario reserva en Supabase y solicita invitaciones al servidor con token Auth; incluye estado y reintento', () => {
  assert.match(calendar, /db\.rpc\('video_create_meeting'/);
  assert.match(calendar, /fetch\('\/api\/video-invitations'/);
  assert.match(calendar, /Authorization: `Bearer \$\{session\.access_token\}`/);
  assert.match(calendar, /data-video-resend/);
  assert.match(calendar, /email_status/);
  assert.match(html, /data-video-resend/);
  assert.match(html, /js\/video-calendar\.js\?v=2026-09-21-fase2-1/);
});

test('SQL agrega reclamo atómico y no habilita RPC a anon/authenticated', () => {
  assert.match(sql, /FOR UPDATE OF o SKIP LOCKED/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.video_claim_pending_invitations\(uuid\) FROM PUBLIC, anon, authenticated/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.video_claim_pending_invitations\(uuid\) TO service_role/);
  assert.doesNotMatch(sql, /DROP TABLE|TRUNCATE TABLE|DELETE FROM public\.domus_app_state/i);
});

test('Rechaza POST sin JWT, petición GET e ID inválido sin enviar correos', async () => {
  const t = harness();
  t.req.headers = {}; await t.handler(t.req, t.res);
  assert.equal(t.res.statusCode, 401); assert.equal(t.sentMail.length, 0);
  t.req.headers.authorization = 'Bearer real-jwt'; t.req.method = 'GET'; await t.handler(t.req, t.res);
  assert.equal(t.res.statusCode, 405);
  t.req.method = 'POST'; t.req.body.meetingId = 'fake'; await t.handler(t.req, t.res);
  assert.equal(t.res.statusCode, 400);
});

test('Sólo el organizador autenticado puede despachar invitaciones', async () => {
  const t = harness({ foreign: true });
  await t.handler(t.req, t.res);
  assert.equal(t.res.statusCode, 403);
  assert.equal(t.sentMail.length, 0);
  assert.equal(t.claimedTimes, 0);
});

test('Correo: una invitación real por SMTP, enlace HTTPS a la web, estado confirmado en ambas tablas', async () => {
  const t = harness();
  await t.handler(t.req, t.res);
  assert.equal(t.res.statusCode, 200);
  assert.equal(t.res.body.ok, true);
  assert.equal(t.res.body.sentNow, 1);
  assert.equal(t.sentMail.length, 1);
  assert.equal(t.sentMail[0].to, 'cmeza@domusalud.cl');
  assert.match(t.sentMail[0].text, new RegExp(`https://domusalud\\.cl/\\?reunion=${meetingId}`));
  assert.doesNotMatch(t.sentMail[0].text, /localhost/i);
  assert.equal(t.status, 'sent');
  assert.equal(t.calls.filter((item) => item.method === 'PATCH').length, 2);
  assert.equal(t.calls.filter((item) => item.method === 'PATCH').every((item) => item.headers.Authorization === `Bearer ${config.SUPABASE_SERVICE_ROLE_KEY}`), true);
  // Repetir solicitud NO duplica correo (reclamación solo de filas pendientes).
  await t.handler(t.req, t.res);
  assert.equal(t.res.statusCode, 200); assert.equal(t.res.body.sentNow, 0);
  assert.equal(t.sentMail.length, 1);
});

test('Fallo SMTP mantiene reunión, registra error y reintenta sin recrearla', async () => {
  const t = harness({ failedSmtp: true });
  await t.handler(t.req, t.res);
  assert.equal(t.res.statusCode, 200);
  assert.equal(t.res.body.ok, false);
  assert.equal(t.res.body.failedNow, 1);
  assert.equal(t.status, 'failed');
  t.setFailure(false);
  await t.handler(t.req, t.res);
  assert.equal(t.res.statusCode, 200);
  assert.equal(t.res.body.sentTotal, 1);
  assert.equal(t.status, 'sent');
  assert.equal(t.sentMail.length, 2);
});

test('Sin SMTP configurado se informa error sin falsa confirmación de envío', async () => {
  const t = harness({ env: { ...config, SMTP_PASS: '' } });
  await t.handler(t.req, t.res);
  assert.equal(t.res.statusCode, 503);
  assert.match(t.res.body.error, /Vercel/);
  assert.equal(t.sentMail.length, 0);
});

test('Un invitado sin email no recibe correo ni se anuncia como enviado', async () => {
  const t = harness({ missingEmail: true });
  await t.handler(t.req, t.res);
  assert.equal(t.res.statusCode, 200);
  assert.equal(t.res.body.ok, false);
  assert.equal(t.res.body.missing, 1);
  assert.equal(t.sentMail.length, 0);
});


test('Organizador y participante reciben correos distintos; segundo intento no duplica', async () => {
  const t = harness({ includeOrganizer: true });
  await t.handler(t.req, t.res);
  assert.equal(t.res.statusCode, 200);
  assert.equal(t.res.body.sentNow, 2);
  assert.equal(t.res.body.sentTotal, 2);
  assert.equal(t.sentMail.length, 2);
  const ownerMail = t.sentMail.find((m) => m.to === 'dgonzalez@domusalud.cl');
  const inviteMail = t.sentMail.find((m) => m.to === 'cmeza@domusalud.cl');
  assert.match(ownerMail.subject, /Confirmación Domus Salud/);
  assert.match(ownerMail.text, /Tu reunión de Domus Salud quedó programada/);
  assert.match(inviteMail.subject, /Invitación Domus Salud/);
  assert.match(ownerMail.text, new RegExp(`https://domusalud\\.cl/\\?reunion=${meetingId}`));
  await t.handler(t.req, t.res);
  assert.equal(t.res.body.sentNow, 0);
  assert.equal(t.sentMail.length, 2);
});
