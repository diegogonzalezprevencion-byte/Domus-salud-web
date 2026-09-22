const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(base, file), 'utf8');
const sql = read('supabase/2026-09-21-fase1-video.sql');
const call = read('js/video-call.js');
const html = read('web.html');
const email = read('api/video-invitations.js');

test('SQL incorpora organizador al outbox, preserva estados enviados y no toca fichas clínicas', () => {
  assert.match(sql, /m\.id=v_organizer OR m\.id=ANY\(v_participants\)\) AND m\.email IS NOT NULL/);
  assert.match(sql, /ON CONFLICT\(meeting_id,member_id,event_type\) DO NOTHING/);
  assert.doesNotMatch(sql, /SET email_status='sent'|DROP TABLE|TRUNCATE|DELETE FROM public\.video_meetings/i);
  assert.match(email, /Confirmación Domus Salud/);
  assert.match(email, /const missing = invited\.filter\(\(p\) => !EMAIL\.test/);
});

test('Cupos de pantalla atómicos, autenticados, con caducidad y renovación', () => {
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.video_screen_leases/);
  assert.match(sql, /FOR UPDATE;/);
  assert.match(sql, /count\(\*\).*video_screen_leases.*>=2/);
  assert.match(sql, /auth\.uid\(\)/);
  assert.match(sql, /EXPIRES_AT/i);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.video_screen_claim\(uuid\) TO authenticated/);
  assert.doesNotMatch(sql, /GRANT SELECT.*video_screen_leases.*authenticated/);
  for(const op of ['claim', 'touch', 'release']) assert.match(call, new RegExp(`video_screen_${op}`));
  assert.match(call, /await context\.db\.rpc\('video_screen_claim'/);
  assert.match(call, /setScreenShareEnabled\(true\)/);
  assert.match(call, /await releaseShare\(\)/);
});

test('La pantalla se dibuja en escenario independiente, admite dos vistas y pantalla completa', () => {
  assert.match(html, /data-video-stage-grid/);
  assert.match(html, /data-video-workspace/);
  assert.match(html, /data-video-fullscreen/);
  assert.match(call, /TrackSubscribed, attach/);
  assert.match(call, /function attach\(track, publication, participant\)/);
  assert.match(call, /if \(isScreen\(publication\)\)/);
  assert.match(call, /stage\.requestFullscreen\(\)/);
  assert.match(read('css/video-preview.css'), /video-stage-grid\[data-count="2"\]/);
});

test('Audio seleccionable y desenfoque real del vídeo con fallback de incompatibilidad', () => {
  for (const marker of ['data-video-audio-input','data-video-audio-output','data-video-devices-toggle','data-video-blur']) {
    assert.ok(html.includes(marker));
  }
  assert.match(call, /switchActiveDevice\(kind, select\.value/);
  assert.match(call, /setSinkId/);
  assert.match(call, /BackgroundProcessor\(\{ mode: 'background-blur'/);
  assert.match(call, /await track\.setProcessor\(processor\)/);
  assert.match(call, /await track\.stopProcessor\(\)/);
  assert.doesNotMatch(read('css/video-preview.css'), /backdrop-filter:\s*blur/);
});
