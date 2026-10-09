const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const web = fs.readFileSync(path.join(root, 'web.html'), 'utf8');
const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));

test('web loads the current Fase 5.9 app bundle, not the legacy cached bundle', () => {
  assert.match(web, /js\/app\.js\?v=2026-10-09-fase59-fix2/);
  assert.doesNotMatch(web, /js\/app\.js\?v=2026-09-21-portal41/);
});

test('prolonged medical visit has its dedicated UI markers', () => {
  assert.match(web, /data-prolonged-medical-only/);
  assert.match(web, /Dispositivos Invasivos/);
  assert.match(web, /Observaciones sobre los dispositivos/);
  assert.match(web, /data-prolonged-signature-help/);
});

test('app bundle is explicitly non-cacheable on Vercel', () => {
  const rule = vercel.headers.find((item) => item.source === '/js/app.js');
  assert.ok(rule);
  assert.ok(rule.headers.some((item) => item.key === 'Cache-Control' && /no-store/.test(item.value)));
});
