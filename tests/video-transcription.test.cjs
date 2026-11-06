const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const base = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(base, 'api/video-transcription.js'), 'utf8');
const sql = fs.readFileSync(path.join(base, 'supabase/2026-09-18-control-transcripcion.sql'), 'utf8');
const html = fs.readFileSync(path.join(base, 'web.html'), 'utf8');
const client = fs.readFileSync(path.join(base, 'js/video-transcription.js'), 'utf8');
const userId = '11111111-1111-4111-8111-111111111111';
const meetingId = '22222222-2222-4222-8222-222222222222';
const runId = '33333333-3333-4333-8333-333333333333';
const env = { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'public-test',
  SUPABASE_SERVICE_ROLE_KEY: 'service-secret-test', LIVEKIT_URL: 'wss://test.livekit.cloud',
  LIVEKIT_API_KEY: 'lk-test', LIVEKIT_API_SECRET: 'lk-secret-test', DOMUS_TRANSCRIPTION_ENABLED: 'true' };

function harness(options={}) {
  let dispatchDeleted=0, dispatchCreated=0, stopped=0;
  const calls=[];
  class AgentDispatchClient {
    constructor(url,key,secret) {
      assert.equal(url, 'https://test.livekit.cloud');
      assert.equal(key, env.LIVEKIT_API_KEY);
      assert.equal(secret, env.LIVEKIT_API_SECRET);
    }
    async createDispatch(room,name,opts) {
      dispatchCreated++;
      assert.equal(room, `domus-${meetingId}`);
      assert.equal(name, 'domus-transcriptor');
      assert.deepEqual(JSON.parse(opts.metadata), { meetingId, runId });
      if (options.dispatchFails) throw Error('dispatch failed');
      return { id: 'AD_dispatch_123' };
    }
    async deleteDispatch(id, room) {
      dispatchDeleted++;
      assert.equal(id, 'AD_dispatch_123');
      assert.equal(room, `domus-${meetingId}`);
      if (options.deleteFails) throw Error('offline');
    }
  }
  const fetchMock = async (url, init={}) => {
    const parsed = new URL(url);
    calls.push({ pathname: parsed.pathname, headers: init.headers });
    let value;
    let status=200;
    if (parsed.pathname === '/auth/v1/user') {
      if (options.unauthorized) { status=401; value={ msg:'Unauthorized' }; }
      else value={ id:userId };
      assert.equal(init.headers.apikey, env.SUPABASE_PUBLISHABLE_KEY);
    } else {
      assert.ok(parsed.pathname.startsWith('/rest/v1/rpc/'));
      if (parsed.pathname.endsWith('/video_transcription_begin')) value=runId;
      else if (parsed.pathname.endsWith('/video_transcription_confirm')) {
        assert.equal(init.headers.apikey, env.SUPABASE_SERVICE_ROLE_KEY);
        value=options.revoked ? false : true;
      } else if (parsed.pathname.endsWith('/video_transcription_stop')) {
        stopped++;
        value=options.noDispatch ? null : 'AD_dispatch_123';
      } else throw Error(parsed.pathname);
      if (!parsed.pathname.endsWith('/video_transcription_confirm')) {
        assert.equal(init.headers.apikey, env.SUPABASE_PUBLISHABLE_KEY);
      }
    }
    return {ok: status === 200, status, async text() { return JSON.stringify(value); }};
  };
  const sandbox = { module: { exports: {} }, require(name) {
    assert.equal(name, 'livekit-server-sdk'); return { AgentDispatchClient };
  }, process: { env: { ...env, ...(options.env || {}) } }, fetch: fetchMock,
  console: { error() {} }, AbortSignal, URL, JSON };
  vm.runInNewContext(source, sandbox, { filename: 'api/video-transcription.js' });
  const req = { method: 'POST', headers: { authorization: 'Bearer valid-token' },
    body: {meetingId, action: 'start'} };
  const res = { headers: {}, setHeader(key,value) { this.headers[key]=value; },
    status(code) { this.statusCode=code; return this; },
    json(body) { this.body=JSON.parse(JSON.stringify(body)); return this; }};
  return {req,res,calls,run: () => sandbox.module.exports(req,res),
    get dispatchCreated() {return dispatchCreated;},
    get dispatchDeleted() {return dispatchDeleted;},
    get stopped() {return stopped;}};
}

test('SQL serializa comienzo y revocación, protege RLS y sólo el servicio confirma/guarda segmentos', () => {
  assert.match(sql, /FOR UPDATE/);
  assert.match(sql, /video_all_consented\(p_meeting_id\)/);
  assert.match(sql, /CREATE POLICY video_transcription_runs_read/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.video_transcription_confirm\(uuid,uuid,text\) TO service_role/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.video_transcription_write_segment\([\s\S]*?TO service_role/);
  assert.match(sql, /IF NOT p_accepted THEN[\s\S]*?status='stopped'/);
  assert.doesNotMatch(sql,/DROP TABLE|TRUNCATE TABLE|DELETE FROM public\.domus_app_state/i);
});

test('Interfaz incluye consentimiento, revocación y visualización por RLS sin claves privadas', () => {
  assert.match(html, /data-video-transcript-accept/);
  assert.match(html, /data-video-transcript-decline/);
  assert.match(html, /data-video-transcript-start/);
  assert.match(html, /data-video-transcript-stop/);
  assert.match(html, /js\/video-transcription\.js/);
  assert.match(client, /video_set_transcription_consent/);
  assert.match(client, /video_transcript_segments/);
  assert.match(client, /video_transcription_runs/);
  assert.match(client, /\/api\/video-transcription/);
  assert.doesNotMatch(client, /SUPABASE_SERVICE_ROLE_KEY|LIVEKIT_API_SECRET/);
  assert.match(client,/body\.textContent = segment\.content/);
});

test('Sin JWT no despacha ni consulta servicio privado', async () => {
  const t=harness(); t.req.headers={}; await t.run();
  assert.equal(t.res.statusCode,401);
  assert.equal(t.dispatchCreated,0);
  assert.equal(t.calls.length,0);
});

test('No inicia agente sin bandera habilitada, ni siquiera con JWT', async () => {
  const t=harness({env:{DOMUS_TRANSCRIPTION_ENABLED:'false'}}); await t.run();
  assert.equal(t.res.statusCode,503); assert.equal(t.dispatchCreated,0);
});

test('Un JWT inválido no consigue iniciar', async () => {
  const t=harness({unauthorized:true}); await t.run();
  assert.equal(t.res.statusCode,401); assert.equal(t.dispatchCreated,0);
});

test('Iniciar usa RPC usuario -> LiveKit -> confirmación privada, no envía secretos al cliente', async () => {
  const t=harness(); await t.run();
  assert.equal(t.res.statusCode,200);
  assert.equal(t.res.body.status,'active');
  assert.equal(t.dispatchCreated,1); assert.equal(t.dispatchDeleted,0);
  assert.deepEqual(t.calls.map(x=>x.pathname), ['/auth/v1/user',
    '/rest/v1/rpc/video_transcription_begin', '/rest/v1/rpc/video_transcription_confirm']);
  assert.ok(!JSON.stringify(t.res.body).includes('secret'));
});

test('Revocación simultánea impide confirmar y elimina despacho', async () => {
  const t=harness({revoked:true}); await t.run();
  assert.equal(t.res.statusCode,409);
  assert.equal(t.dispatchCreated,1); assert.equal(t.dispatchDeleted,1);
});

test('Fallo al despachar revierte la sesión para permitir reintento', async () => {
  const t=harness({dispatchFails:true}); await t.run();
  assert.equal(t.res.statusCode,500); assert.equal(t.stopped,1);
});

test('Detener invalida estado antes de retirar despacho y mantiene stop si LiveKit falla', async () => {
  const t=harness({deleteFails:true}); t.req.body.action='stop'; await t.run();
  assert.equal(t.res.statusCode,200);
  assert.equal(t.res.body.status,'stopped');
  assert.match(t.res.body.warning,/Supabase/);
  assert.equal(t.stopped,1); assert.equal(t.dispatchDeleted,1);
  assert.deepEqual(t.calls.map(x=>x.pathname), ['/auth/v1/user', '/rest/v1/rpc/video_transcription_stop']);
});
