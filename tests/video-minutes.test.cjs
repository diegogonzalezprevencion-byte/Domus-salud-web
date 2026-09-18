const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const sql=fs.readFileSync(path.join(root,'supabase/2026-09-18-actas-gratuitas.sql'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'js/video-minutes.js'),'utf8');
const vercel=JSON.parse(fs.readFileSync(path.join(root,'vercel.json'),'utf8'));
test('actas gratuitas: sin servicio externo de IA ni backend de generación',()=>{
  assert.equal(fs.existsSync(path.join(root,'api/video-minutes.js')),false);
  assert.doesNotMatch(js,/api\.openai\.com|\/api\/video-minutes|OPENAI_API_KEY|video_minutes_all_consented/);
  assert.doesNotMatch(html,/api de OpenAI|Generar borrador con IA|data-video-minutes-consent-yes/);
  assert.deepEqual(vercel.functions,undefined);
});
test('interfaz con plantilla, transcripción original, revisión y exportación',()=>{
  for(const term of ['Crear plantilla de acta','data-video-minutes-transcript-load','data-video-minutes-approve','Descargar Word (.docx)','data-video-minutes-pdf'])
    assert.ok(html.includes(term),`Falta ${term}`);
  assert.match(js,/video_minutes_create_template/);
  assert.match(js,/video_transcript_segments/);
  assert.match(js,/video_minutes_save/);
  assert.match(js,/video_minutes_approve/);
  assert.match(js,/session\.minutes\?\.status!=='approved'/);
  assert.match(js,/\.print\(\)/);
});
test('plantilla generada con JWT del administrador, RLS y conteo servidor, sin suplantación',()=>{
  assert.match(sql,/ALTER TABLE public\.video_meeting_minutes ENABLE ROW LEVEL SECURITY/i);
  assert.match(sql,/CREATE POLICY video_meeting_minutes_read/i);
  assert.match(sql,/video_is_meeting_participant\(meeting_id\)/);
  assert.match(sql,/video_minutes_admin\(p_meeting_id\)/);
  assert.match(sql,/m\.auth_user_id=\(SELECT auth\.uid\(\)\)/);
  assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.video_minutes_create_template\(uuid,boolean,integer\) TO authenticated/);
  assert.match(sql,/SELECT COUNT\(\*\) INTO v_count FROM public\.video_transcript_segments/);
  assert.match(sql,/IF v_count=0 THEN/);
  assert.match(sql,/v_run <> 'stopped'/);
  assert.match(sql,/v_existing\.status='approved'/);
  assert.match(sql,/p_expected_revision IS DISTINCT FROM v_existing\.revision/);
  assert.doesNotMatch(sql,/DROP TABLE|TRUNCATE TABLE|DELETE FROM public\.domus_app_state/i);
});
test('acta requiere edición humana, aprobación y evita falsos acuerdos automatizados',()=>{
  assert.match(sql,/summary=''[,\s]*topics=''[,\s]*agreements=''/);
  assert.match(sql,/length\(btrim\(summary\)\)>0/);
  assert.match(sql,/status='approved'/);
  assert.match(js,/La aplicación no interpreta acuerdos ni redacta resúmenes automáticamente/);
  assert.match(html,/no interpreta ni inventa acuerdos/i);
});
