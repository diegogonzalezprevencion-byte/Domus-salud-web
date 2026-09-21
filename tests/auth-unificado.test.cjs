const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const calendar = fs.readFileSync(path.join(root, 'js/video-calendar.js'), 'utf8');
const start = app.indexOf('// Solo un usuario validado con Supabase Auth');
const end = app.indexOf('const adminShell = ', start);
assert.ok(start >= 0 && end > start, 'bloque de autenticación disponible');
const authCode = app.slice(start, end);
function harness({ session = { access_token: 'valid' }, profile = { id: 'admin:admin-diego', role: 'admin', active: true }, remoteUser = { id: 'uid-1' } } = {}) {
  const cache = new Map([['adminSession', JSON.stringify({ id: 'admin-diego' })]]);
  const admins = [{ id: 'admin-diego', name: 'Diego', username: 'diego' }];
  let authCallback, leaves = 0;
  const auth = {
    async getSession() { return { data: { session }, error: null }; },
    async getUser() { return { data: { user: remoteUser }, error: null }; },
    onAuthStateChange(handler) { authCallback = handler; },
    async signOut() { authCallback?.('SIGNED_OUT'); return { error: null }; }
  };
  const sandbox = {
    DOMUS_DB: {
      auth,
      from(name) {
        assert.equal(name, 'video_members');
        return { select() { return this; }, eq(key, val) {
          assert.equal(key, 'auth_user_id'); assert.equal(val, remoteUser.id); return this;
        }, async maybeSingle() { return { data: profile, error: null }; } };
      }
    },
    DOMUS_STORAGE_KEYS: { session: 'adminSession' },
    storageGet(key, fallback) { return cache.has(key) ? JSON.parse(cache.get(key)) : fallback; },
    storageSet(key, value) { cache.set(key, JSON.stringify(value)); },
    getAdminUsers() { return admins; },
    window: { sessionStorage: { removeItem: (key) => cache.delete(key) }, DomusVideoCall: { leave: async () => { leaves++; } } },
    adminShell: null, renderAdminState() {}, console
  };
  vm.runInNewContext(authCode, sandbox);
  return { sandbox, cache, auth, trigger: (name) => authCallback(name), leaves: () => leaves };
}
test('Una sesión antigua de Domus NO habilita el administrador sin validación Supabase', () => {
  const t = harness();
  assert.equal(t.sandbox.getCurrentAdmin(), null);
});
test('Restaurar sesión vinculada permite reutilizar el acceso sin segundo formulario', async () => {
  const t = harness();
  await t.sandbox.restoreDomusAdminSession();
  assert.equal(t.sandbox.getCurrentAdmin().id, 'admin-diego');
  assert.equal(JSON.parse(t.cache.get('adminSession')).id, 'admin-diego');
});
test('Identidad no vinculada o sin rol admin no adquiere acceso', async () => {
  const t = harness({ profile: { id: 'professional:sample', role: 'professional', active: true } });
  await t.sandbox.restoreDomusAdminSession();
  assert.equal(t.sandbox.getCurrentAdmin(), null);
  assert.equal(t.cache.has('adminSession'), false);
});
test('Cerrar Supabase elimina sesión administrativa y abandona llamada', async () => {
  const t = harness();
  await t.sandbox.restoreDomusAdminSession();
  t.trigger('SIGNED_OUT');
  assert.equal(t.sandbox.getCurrentAdmin(), null);
  assert.equal(t.cache.has('adminSession'), false);
  // leave is triggered without await in handler; observe after microtasks.
  await Promise.resolve();
  assert.equal(t.leaves(), 1);
});
test('No queda formulario de segundo acceso y el login usa Supabase Auth solo al entrar a Administrador', () => {
  assert.ok(!html.includes('data-video-login'));
  assert.ok(!html.includes('data-video-disconnect'));
  assert.ok(html.includes('name="email" type="email" autocomplete="username"'));
  assert.equal((app.match(/auth\.signInWithPassword/g) || []).length, 1);
  assert.ok(!calendar.includes('signInWithPassword'));
  assert.ok(calendar.includes('window.DomusVideoAgenda = { connect }'));
  assert.ok(!app.slice(app.indexOf("adminLoginForm?.addEventListener('submit'"), app.indexOf("adminUserForm?.addEventListener('submit'")).includes('candidate.password === password')); // profesional mantiene login legado aparte
});
