const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=(pathRelative)=>fs.readFileSync(path.join(root,pathRelative),'utf8');
const sql=read('supabase/2026-09-21-fase2-invitados.sql');
const ui=read('js/video-guests-admin.js');
const guest=read('js/video-guest.js');
const endpoint=read('api/video-guests.js');
const html=read('invitado.html');

test('Enlace: huella SHA-256, RLS y RPC solo servidor',()=>{
  assert.match(sql,/CREATE TABLE IF NOT EXISTS public\.video_guest_links/);
  assert.match(sql,/token_hash text NOT NULL UNIQUE/);
  assert.match(sql,/ENABLE ROW LEVEL SECURITY/g);
  assert.match(sql,/REVOKE ALL ON public\.video_guest_links, public\.video_guest_entries FROM PUBLIC, anon, authenticated/);
  for(const action of ['video_guest_link_create','video_guest_link_revoke','video_guest_link_status','video_guest_join']) {
    assert.match(sql,new RegExp(`GRANT EXECUTE ON FUNCTION public\\.${action}\\([^;]+\\) TO service_role`));
  }
  assert.match(endpoint,/crypto\.randomBytes\(32\)/);
  assert.match(endpoint,/createHash\('sha256'\)/);
  assert.doesNotMatch(sql,/token_secret|plaintext_secret/i);
});

test('Servidor valida organizador y horario; en fase 3 también habilita pantalla y datos',()=>{
  assert.match(endpoint,/\/auth\/v1\/user/);
  assert.match(sql,/auth_user_id=p_actor/);
  assert.match(sql,/FOR UPDATE/);
  assert.match(sql,/revoked_at IS NULL/);
  assert.match(sql,/starts_at-interval '15 minutes'/);
  assert.match(endpoint,/canPublishSources: \[1,2,3,4\]/);
  assert.match(endpoint,/canPublishData: true/);
  assert.match(endpoint,/ttl: '30s'/);
  assert.match(endpoint,/removeParticipant\(roomName, participant\.identity\)/);
  assert.doesNotMatch(guest,/domusSupabase|SUPABASE_SERVICE_ROLE_KEY|LIVEKIT_API_SECRET/);
  assert.doesNotMatch(html,/js\/video-chat\.js|js\/video-minutes\.js|js\/app\.js/);
  assert.match(html,/noindex,nofollow/);
  assert.match(html,/no-referrer/);
});

test('Consentimiento: una reunión enlazada jamás vuelve a transcribir, interna conserva control',()=>{
  assert.match(sql,/IF EXISTS \(SELECT 1 FROM public\.video_transcription_runs WHERE meeting_id=p_meeting_id\)/);
  assert.match(sql,/IF EXISTS \(SELECT 1 FROM public\.video_guest_links WHERE meeting_id=p_meeting_id\)/);
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.video_transcription_begin/);
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.video_transcription_confirm/);
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.video_transcription_write_segment/);
  assert.match(sql,/public\.video_all_consented\(p_meeting_id\)/);
  assert.match(read('js/video-transcription.js'),/session\.external/);
  assert.match(read('js/video-minutes.js'),/session\.external/);
  assert.match(sql,/source_segments>0 OR EXISTS/);
});

test('La interfaz externa no expone fichas ni administrador y ofrece las funciones de la sala',()=>{
  assert.match(read('index.html'),/data-guest-admin/);
  assert.match(ui,/domus:meeting-detail/);
  assert.match(ui,/detail\.organizerId === detail\.memberId/);
  assert.match(ui,/navigator\.clipboard\.writeText/);
  assert.match(guest,/window\.location\.hash/);
  assert.match(html,/data-guest-form/);
  assert.match(guest,/textContent=result\.meeting\.title/);
  assert.match(guest,/BackgroundProcessor/);
  assert.match(guest,/switchActiveDevice/);
  assert.match(guest,/requestFullscreen/);
  assert.match(read('js/minutes-docx.js'),/Acta manual sin transcripción automática/);
});

test('Configuración mantiene variable pública existente y encabezados estrictos de invitado',()=>{
  const vercel=JSON.parse(read('vercel.json'));
  assert.equal(vercel.cleanUrls,true);
  assert.ok(vercel.headers.some(entry=>entry.source==='/invitado'&&entry.headers.some(header=>header.key==='Referrer-Policy'&&header.value==='no-referrer')));
  assert.match(endpoint,/PUBLIC_SITE_URL/);
  assert.match(endpoint,/SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(guest,/localStorage|sessionStorage/);
});
