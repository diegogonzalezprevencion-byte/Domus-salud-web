const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'css/styles.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'web.html'), 'utf8');

test('Fase 5.9 Fix 2: hidden siempre oculta componentes con display propio', () => {
  assert.match(css, /\[hidden\]\s*\{\s*display\s*:\s*none\s*!important\s*\}/i);
});

test('Fase 5.9 Fix 2: CSS y JS usan versionado nuevo para evitar cache', () => {
  assert.match(html, /styles\.css\?v=2026-10-09-fase61-cuidados-completos/);
  assert.match(html, /app\.js\?v=2026-10-09-fase61-cuidados-completos/);
});
