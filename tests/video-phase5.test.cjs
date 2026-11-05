const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');

test('Fase 5.1: reemplaza calendario privado por edición de reuniones',()=>{
  const sql=read('supabase/2026-09-24-fase51-reuniones-editables.sql');
  const js=read('js/video-calendar.js');
  const html=read('web.html');
  const css=read('css/video-preview.css');
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.video_update_meeting\(/);
  assert.match(sql,/USING \(public\.video_can_read_meeting\(id\)\)/);
  assert.match(sql,/m\.role='admin'[\s\S]*OR EXISTS/);
  assert.match(js,/db\.rpc\('video_update_meeting'/);
  assert.match(js,/data-video-edit/);
  assert.match(html,/data-video-edit/);
  assert.doesNotMatch(css,/video-day\.has-meetings:not\(\[aria-pressed="true"\]\)\{background:/);
});

test('Fase 5.1: edición conserva enlace externo y vuelve a encolar invitaciones',()=>{
  const sql=read('supabase/2026-09-24-fase51-reuniones-editables.sql');
  assert.match(sql,/status='pending'/);
  assert.match(sql,/attempts=0/);
  assert.match(sql,/UPDATE public\.video_guest_links[\s\S]*expires_at=p_starts_at/);
});

test('Fase 5.1: deduplica perfil profesional secundario de un admin autenticado',()=>{
  const sql=read('supabase/2026-09-24-fase51-reuniones-editables.sql');
  assert.match(sql,/_domus_member_merge/);
  assert.match(sql,/d\.auth_user_id IS NULL/);
  assert.match(sql,/x\.auth_user_id IS NOT NULL/);
  assert.match(sql,/UPDATE public\.video_members d[\s\S]*SET active=false/);
});

test('Fase 5.1: enlace externo recuperable permanece en el resumen',()=>{
  const sql=read('supabase/2026-09-24-fase51-reuniones-editables.sql');
  const api=read('api/video-guests.js');
  const ui=read('js/video-guests-admin.js');
  assert.match(sql,/ADD COLUMN IF NOT EXISTS token_secret text/);
  assert.match(api,/shareLink/);
  assert.match(api,/p_token_secret: secret/);
  assert.match(ui,/link = result\.shareLink \|\| null/);
});

test('Fase 5.1: acta colaborativa dentro de la llamada y para invitados',()=>{
  const html=read('web.html');
  const live=read('js/video-live-minutes.js');
  const sql=read('supabase/2026-09-24-fase51-reuniones-editables.sql');
  const guest=read('invitado.html');
  assert.match(html,/data-video-minutes-live-toggle/);
  assert.match(html,/data-video-live-minutes/);
  assert.match(live,/video_minutes_save/);
  assert.match(sql,/video_minutes_editor/);
  assert.match(sql,/video_guest_minutes_save/);
  assert.match(guest,/data-guest-minutes-form/);
});
