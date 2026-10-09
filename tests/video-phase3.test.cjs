const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const sql=read('supabase/2026-09-21-fase3-paridad.sql');
const guest=read('js/video-guest.js');
const internal=read('js/video-call.js');
const api=read('api/video-guests.js');
const agent=read('agent/agent.py');

test('Fase 3: consentimiento individual del invitado, firmado por sesión en servidor',()=>{
  assert.match(sql,/ADD COLUMN IF NOT EXISTS session_hash text/);
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.video_guest_session\(/);
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.video_guest_set_consent\(/);
  assert.match(sql,/NOT public\.video_all_consented\(v_meeting\)/);
  assert.match(sql,/WHERE meeting_id=p_meeting_id AND run_id=p_run_id AND status='active'/);
  assert.match(sql,/REVOKE ALL ON FUNCTION public\.video_guest_join\(text,text,text\) FROM PUBLIC,anon,authenticated,service_role/);
  assert.match(api,/p_session_hash: hash\(sessionToken\)/);
  assert.match(api,/video_guest_session/);
  assert.doesNotMatch(api,/return json\(res, 200, \{[^}]*service/);
});

test('Fase 3: invitados e internos comparten los DOS cupos bajo bloqueo',()=>{
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.video_screen_claim\(p_meeting_id uuid\)/);
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.video_guest_screen_claim\(/);
  assert.match(sql,/video_guest_screen_leases WHERE meeting_id=v_meeting\)>=2/);
  assert.match(sql,/SELECT id INTO v_meeting FROM public\.video_meetings[\s\S]*FOR UPDATE/);
  assert.match(guest,/request\('share-claim'/);
  assert.match(guest,/request\('share-touch'/);
  assert.match(guest,/request\('share-release'/);
});

test('Fase 3: cámara solo una vez por identidad y fallback de pantalla completa móvil',()=>{
  for(const code of [internal,guest]){
    assert.match(code,/remoteCameras\.get\(/);
    assert.match(code,/existing\?\.track\s*===\s*track/);
    assert.match(code,/\.replaceChildren\(element\)/);
    assert.match(code,/typeof [\w.]+\.requestFullscreen\s*!==\s*'function'/);
    assert.match(code,/theater-mode/);
  }
  assert.match(read('css/video-guest.css'),/\.screens\.theater-mode/);
  assert.match(read('css/video-guest.css'),/\.controls\{position:relative/);
});

test('Fase 3: invitados pueden chatear y transcribir con consentimiento',()=>{
  for(const action of ['chat-read','chat-send','consent','transcription-start','transcription-stop']){
    assert.ok(api.includes(`'${action}'`),action);
  }
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.video_guest_chat_history\(/);
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.video_guest_send_chat\(/);
  assert.match(sql,/status='stopped',updated_at=now\(\)/);
  assert.match(guest,/textContent=segment\.text/);
  assert.match(guest,/message\.textContent=item\.body/);
  assert.match(agent,/rtc\.TrackSource\.SOURCE_MICROPHONE/);
  assert.match(agent,/rpc\/video_transcription_write_segment/);
});
