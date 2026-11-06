const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const internalHtml = read('web.html');
const guestHtml = read('invitado.html');
const internal = read('js/video-call.js');
const guest = read('js/video-guest.js');

test('Fase 5.5: incluye 10 fondos optimizados y selector para internos e invitados', () => {
  for (let i = 1; i <= 10; i++) {
    const rel = `assets/video-backgrounds/fondo-${i}.webp`;
    const full = path.join(root, rel);
    assert.ok(fs.existsSync(full), rel);
    assert.ok(fs.statSync(full).size > 1000, `${rel} no debe estar vacío`);
    assert.ok(internalHtml.includes(`/${rel}`), `interno ${rel}`);
    assert.ok(guestHtml.includes(`/${rel}`), `invitado ${rel}`);
  }
  assert.ok(internalHtml.includes('data-video-backgrounds-toggle'));
  assert.ok(guestHtml.includes('data-guest-backgrounds-button'));
});

test('Fase 5.5: usa procesamiento real previo a LiveKit y conserva desenfoque', () => {
  for (const code of [internal, guest]) {
    assert.match(code, /virtual-background/);
    assert.match(code, /imagePath/);
    assert.match(code, /BackgroundProcessor/);
    assert.match(code, /setProcessor/);
    assert.match(code, /stopProcessor/);
    assert.match(code, /supportsBackgroundProcessors/);
  }
});

test('Fase 5.5: no agrega migración SQL adicional', () => {
  const fase55Sql = path.join(root, 'supabase', '2026-10-07-fase55-fondos.sql');
  assert.equal(fs.existsSync(fase55Sql), false);
  assert.match(read('INSTALACION-FASE55.md'), /No hay migración SQL/);
});
