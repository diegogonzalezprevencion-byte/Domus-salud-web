const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=path.join(__dirname,'..');
const code=fs.readFileSync(path.join(base,'api/video-minutes.js'),'utf8');
const sql=fs.readFileSync(path.join(base,'supabase/2026-09-18-actas-ia.sql'),'utf8');
const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
const js=fs.readFileSync(path.join(base,'js/video-minutes.js'),'utf8');
const meetingId='22222222-2222-4222-8222-222222222222';
const userId='11111111-1111-4111-8111-111111111111';
const output={summary:'Revisión de avances',topics:'Se conversó el calendario',agreements:'No consta en la transcripción',commitments:'No consta en la transcripción',pending:'Próxima revisión',notes:'Confirmar fechas'};
const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'pub-test',SUPABASE_SERVICE_ROLE_KEY:'svc-secret',OPENAI_API_KEY:'api-test'};
function harness(options={}) {
  let aiCalls=0,stored=0,consentCalls=0;
  const calls=[];
  const fetchMock=async (target,init={})=>{
    const u=new URL(target);let value,code=200;
    calls.push({path:u.pathname,init,query:u.searchParams});
    if(u.hostname==='api.openai.com') {
      aiCalls++;
      const request=JSON.parse(init.body);
      assert.equal(init.headers.Authorization,'Bearer api-test');
      assert.equal(request.store,false);
      assert.equal(request.text.format.type,'json_schema');
      assert.equal(request.text.format.strict,true);
      value={status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(output)}]}]};
      if(options.aiFails){code=429;value={error:'Rate limit'};}
    } else if(u.pathname==='/auth/v1/user'){
      value={id:userId};
      assert.equal(init.headers.Authorization,'Bearer user-token');
    } else if(u.pathname.endsWith('/rpc/video_minutes_all_consented')) {
      consentCalls++;
      value=options.denied || (options.revokedDuringAI && consentCalls>1) ? false:true;
    } else if(u.pathname.endsWith('/rpc/video_minutes_store_generated')){
      stored++;
      assert.equal(init.headers.apikey,env.SUPABASE_SERVICE_ROLE_KEY);
      const sent=JSON.parse(init.body);
      assert.deepEqual(sent.p_sections,output);
      assert.equal(sent.p_segment_count,1);
      value=options.storeFails?false:true;
    } else if(u.pathname.endsWith('/video_members')){
      value=[{id:'admin:admin-dgonzalez',role:options.notAdmin?'professional':'admin',active:true}];
    } else if(u.pathname.endsWith('/video_meetings')) {
      value=[{id:meetingId,title:'Prueba de comité',starts_at:'2026-09-18T13:00:00Z',duration_minutes:30,status:'scheduled'}];
    } else if(u.pathname.endsWith('/video_meeting_participants')){
      value=options.notInvited?[{member_id:'other',video_members:{display_name:'Otra persona'}}]:
        [{member_id:'admin:admin-dgonzalez',video_members:{display_name:'Diego'}}];
    } else if(u.pathname.endsWith('/video_meeting_minutes')){
      value=options.approved?[{status:'approved'}]:(options.oldDraft?[{status:'draft',generated_at:'2025-01-01T00:00:00Z',revision:2}]:[]);
    } else if(u.pathname.endsWith('/video_transcription_runs')){
      value=[{status:options.active?'active':'stopped'}];
    } else if(u.pathname.endsWith('/video_transcript_segments')){
      value=options.noSegments?[]:[{id:meetingId,member_id:'admin:admin-dgonzalez',content:options.longText?'a'.repeat(110001):'Se revisará el calendario',starts_at:'2026-09-18T13:04:00Z'}];
    } else throw Error('Unexpected '+u.pathname);
    return {ok:code===200,status:code,async text(){return JSON.stringify(value);},async json(){return value;}};
  };
  const sandbox={module:{exports:{}},fetch:fetchMock,process:{env:{...env,...(options.env||{})}},console:{error(){}},AbortSignal,URL};
  vm.runInNewContext(code,sandbox,{filename:'api/video-minutes.js'});
  const req={method:'POST',headers:{authorization:options.noAuth?'':'Bearer user-token'},body:{meetingId,replaceDraft:!!options.replaceDraft}};
  const res={setHeader(){},status(value){this.statusCode=value;return this;},json(value){this.body=value;return this;}};
  return {async run(){await sandbox.module.exports(req,res);return res;},req,res,calls,
    get aiCalls(){return aiCalls;},get stored(){return stored;},get consentCalls(){return consentCalls;}};
}
test('SQL activa RLS, separa el consentimiento IA y limita RPC de guardado a service_role',()=>{
  assert.match(sql,/ALTER TABLE public.video_minutes_consent ENABLE ROW LEVEL SECURITY/i);
  assert.match(sql,/ALTER TABLE public.video_meeting_minutes ENABLE ROW LEVEL SECURITY/i);
  assert.match(sql,/public.video_minutes_set_consent\(uuid,boolean\).*?TO authenticated/is);
  assert.match(sql,/public.video_minutes_store_generated\(uuid,text,jsonb,integer,text,boolean,integer\) TO service_role/i);
  assert.match(sql,/public.video_minutes_all_consented\(p_meeting_id\)/i);
  assert.match(sql,/video_minutes_approve/);
});
test('web incorpora acta, consentimiento nuevo y exportación solo al aprobar',()=>{
  assert.match(html,/data-video-minutes-open/);
  assert.match(html,/data-video-minutes-consent-yes/);
  assert.match(html,/api de OpenAI/i);
  assert.match(js,/session.minutes\?\.status!=='approved'/);
  assert.match(js,/print\(\)/);
  assert.match(html,/Descargar Word \(\.docx\)/);
});
test('rechaza la generación sin sesión',async()=>{
  const h=harness({noAuth:true});const res=await h.run();assert.equal(res.statusCode,401);assert.equal(h.aiCalls,0);
});
test('rechaza cuenta no administradora, antes de enviar texto a IA',async()=>{
  const h=harness({notAdmin:true});const res=await h.run();assert.equal(res.statusCode,403);assert.equal(h.aiCalls,0);
});
test('rechaza si el administrador no fue invitado',async()=>{
  const h=harness({notInvited:true});const res=await h.run();assert.equal(res.statusCode,403);assert.equal(h.aiCalls,0);
});
test('rechaza sin consentimiento independiente',async()=>{
  const h=harness({denied:true});const res=await h.run();assert.equal(res.statusCode,403);assert.equal(h.aiCalls,0);
});
test('rechaza mientras la transcripción sigue activa',async()=>{
  const h=harness({active:true});const res=await h.run();assert.equal(res.statusCode,409);assert.equal(h.aiCalls,0);
});
test('rechaza una reunión sin segmentos',async()=>{
  const h=harness({noSegments:true});const res=await h.run();assert.equal(res.statusCode,409);assert.equal(h.aiCalls,0);
});
test('no resume silenciosamente una transcripción que supera el límite',async()=>{
  const h=harness({longText:true});const res=await h.run();assert.equal(res.statusCode,413);assert.equal(h.aiCalls,0);
});
test('impide sobrescribir un acta aprobada',async()=>{
  const h=harness({approved:true});const res=await h.run();assert.equal(res.statusCode,409);assert.equal(h.aiCalls,0);
});
test('exige confirmación antes de reemplazar borrador',async()=>{
  const h=harness({oldDraft:true});const res=await h.run();assert.equal(res.statusCode,409);assert.equal(h.aiCalls,0);
});
test('flujo correcto genera texto estructurado con store=false, revalida y guarda borrador',async()=>{
  const h=harness();const res=await h.run();assert.equal(res.statusCode,200);assert.equal(res.body.status,'draft');assert.equal(h.aiCalls,1);assert.equal(h.consentCalls,2);assert.equal(h.stored,1);
});
test('revocación durante solicitud impide guardar el acta',async()=>{
  const h=harness({revokedDuringAI:true});const res=await h.run();assert.equal(res.statusCode,409);assert.equal(h.aiCalls,1);assert.equal(h.stored,0);
});
test('si falta la clave de IA, comunica configuración pendiente sin enviar datos',async()=>{
  const h=harness({env:{OPENAI_API_KEY:''}});const res=await h.run();assert.equal(res.statusCode,503);assert.equal(h.aiCalls,0);
});
