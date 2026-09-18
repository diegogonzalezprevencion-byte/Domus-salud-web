/* Domus Salud · Actas de reuniones. Sólo el botón Generar envía texto a la IA.
   Siempre se recuperan documentos desde Supabase y se muestran como texto, no HTML. */
(() => {
  'use strict';
  const root = document.querySelector('[data-admin-view="video"]');
  if (!root) return;
  const $ = (selector) => root.querySelector(selector);
  const dialog = $('[data-video-minutes-dialog]');
  const title = $('[data-video-minutes-title]');
  const state = $('[data-video-minutes-state]');
  const decisions = $('[data-video-minutes-consents]');
  const agree = $('[data-video-minutes-consent-yes]');
  const reject = $('[data-video-minutes-consent-no]');
  const generate = $('[data-video-minutes-generate]');
  const save = $('[data-video-minutes-save]');
  const approve = $('[data-video-minutes-approve]');
  const word = $('[data-video-minutes-word]');
  const pdf = $('[data-video-minutes-pdf]');
  const form = $('[data-video-minutes-form]');
  const badge = $('[data-video-minutes-badge]');
  const source = $('[data-video-minutes-source]');
  const fields = ['summary','topics','agreements','commitments','pending','notes'];
  const labels = { summary:'Resumen ejecutivo',topics:'Temas tratados',agreements:'Acuerdos confirmados',
    commitments:'Compromisos, responsables y plazos',pending:'Pendientes',notes:'Observaciones y aspectos por confirmar' };
  const empty = 'No consta en la transcripción.';
  let current=null;
  let nonce=0;
  const escape = (value) => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;')
    .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
  function notify(text,error=false) { state.textContent=text; state.dataset.error=String(error); }
  function participantName(row) { return row.video_members?.display_name || row.member_id; }
  function consented(session) {
    return session.people.length>0 && session.people.every((p) => session.decisions.some((c) => c.member_id===p.member_id && c.accepted===true));
  }
  function updateControls(session) {
    if (session!==current) return;
    const all = consented(session);
    const own = session.decisions.find((c) => c.member_id===session.member.id);
    const locked=!!session.busy;
    const row=session.minutes;
    const draft=row?.status==='draft';
    const approved=row?.status==='approved';
    const active=session.runStatus!=='stopped';
    agree.disabled=locked || own?.accepted===true;
    reject.disabled=locked || own?.accepted===false;
    generate.disabled=locked || !all || active || !session.segmentCount || approved;
    generate.hidden=session.member.role!=='admin';
    generate.textContent=draft?'Regenerar borrador con IA':'Generar borrador con IA';
    form.hidden=!row;
    for (const key of fields) {
      const field=form.elements[key];
      field.readOnly=locked || approved;
    }
    save.hidden=!draft;
    approve.hidden=!draft;
    save.disabled=locked;
    approve.disabled=locked || !all || !form.elements.summary.value.trim() || !!(row && fields.some((key)=>form.elements[key].value!==(row[key]||'')));  
    word.hidden=!approved;
    pdf.hidden=!approved;
    badge.textContent=approved?'APROBADA':draft?'BORRADOR • REVISIÓN OBLIGATORIA':'SIN ACTA';
    badge.dataset.status=approved?'approved':'draft';
    source.textContent=row ? `Fuente: ${row.source_segments} fragmentos transcritos · revisión ${row.revision} · ${approved?'Aprobada y bloqueada':'Editable hasta aprobar'}`
      : `Fuente: ${session.segmentCount} fragmentos transcritos · ${active?'Detén la transcripción antes de generar':'Sin documento generado'}`;
    decisions.replaceChildren();
    for (const person of session.people) {
      const item=document.createElement('div'); item.className='video-minutes-person';
      const who=document.createElement('span'); who.textContent=participantName(person);
      const accepted=session.decisions.find((c)=>c.member_id===person.member_id)?.accepted;
      const answer=document.createElement('strong'); answer.textContent=accepted===true?'Autorizó':accepted===false?'Rechazó':'Pendiente';
      answer.dataset.accepted=String(accepted); item.append(who,answer); decisions.append(item);
    }
    if (!session.manual) {
      if (approved) notify('Acta aprobada. Puedes descargarla; ya no se modifica desde esta versión.');
      else if (draft) notify('Borrador generado por IA. Revisa nombres, acuerdos y compromisos antes de aprobar.');
      else if (!all) notify('Cada invitado debe autorizar el uso de su transcripción para elaborar el acta con IA.');
      else if (active) notify('Detén primero la transcripción y espera a que se guarden los fragmentos finales.');
      else if (!session.segmentCount) notify('Esta reunión no tiene transcripción guardada.');
      else notify('Todo listo. Genera el borrador con IA; la revisión y aprobación serán manuales.');
    }
  }
  async function load(session) {
    const [c,m,r,s]=await Promise.all([
      session.db.from('video_minutes_consent').select('member_id,accepted,decided_at').eq('meeting_id',session.meeting.id),
      session.db.from('video_meeting_minutes').select('*').eq('meeting_id',session.meeting.id).maybeSingle(),
      session.db.from('video_transcription_runs').select('status').eq('meeting_id',session.meeting.id).maybeSingle(),
      session.db.from('video_transcript_segments').select('id',{count:'exact',head:true}).eq('meeting_id',session.meeting.id)
    ]);
    const error=c.error||m.error||r.error||s.error;
    if (error) throw error;
    if (session!==current) return;
    session.decisions=c.data||[];
    session.minutes=m.data||null;
    session.runStatus=r.data?.status||'stopped';
    session.segmentCount=s.count||0;
    for (const key of fields) form.elements[key].value=session.minutes?.[key]||'';
    session.manual=false;
    updateControls(session);
  }
  function close() { nonce++; dialog.hidden=true; current=null; }
  async function open(meeting,member,db) {
    close();
    const id=++nonce;
    const session={meeting,member,db,people:meeting.participants||[],decisions:[],minutes:null,
      segmentCount:0,runStatus:'stopped',busy:true,manual:true};
    current=session; dialog.hidden=false;
    title.textContent=`Acta · ${meeting.title}`;
    form.hidden=true;
    notify('Consultando transcripción y autorizaciones...');
    updateControls(session);
    try { await load(session); session.busy=false;updateControls(session); }
    catch (error) { session.busy=false; if (nonce===id) { session.manual=true; notify(`No se pudo abrir el acta: ${error.message}. ¿Ejecutaste el SQL de actas?`,true); generate.disabled=true; } }
  }
  async function consent(accepted) {
    const session=current;
    if (!session || session.busy) return;
    session.busy=true;session.manual=true;notify('Guardando tu decisión...');updateControls(session);
    try {
      const result=await session.db.rpc('video_minutes_set_consent',{p_meeting_id:session.meeting.id,p_accepted:accepted});
      if (result.error || result.data!==true) throw result.error||new Error('Supabase no confirmó la decisión.');
      await load(session);
      session.manual=true;
      notify(accepted?'Autorización para acta IA registrada.':'Autorización retirada: no podrán generarse nuevos borradores sin tu permiso.');
    } catch(error) {session.manual=true;notify(`No se pudo guardar la autorización: ${error.message}`,true);}
    finally {session.busy=false;updateControls(session);}
  }
  async function generateDraft() {
    const session=current;
    if (!session || session.busy || !consented(session) || session.runStatus!=='stopped' || !session.segmentCount) return;
    const replaceDraft=!!session.minutes;
    if (replaceDraft && !window.confirm('¿Reemplazar el borrador actual? Se perderán sus modificaciones. Esta acción consumirá nuevamente la API de IA.')) return;
    session.busy=true;session.manual=true;notify('Generando acta a partir de toda la transcripción. Espera sin cerrar esta ventana...');updateControls(session);
    try {
      const {data:{session:auth},error:authError}=await session.db.auth.getSession();
      if (authError || !auth?.access_token) throw new Error('Tu sesión venció.');
      const response=await fetch('/api/video-minutes',{
        method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${auth.access_token}`},
        body:JSON.stringify({meetingId:session.meeting.id,replaceDraft}),cache:'no-store'
      });
      const result=await response.json().catch(()=>({}));
      if (!response.ok) throw new Error(result.error||`Error del servidor (${response.status})`);
      await load(session);
      session.manual=true;notify(`Borrador generado con ${result.sourceSegments} fragmentos. Revisa y guarda tus correcciones.`);
    } catch(error) {session.manual=true;notify(`No se generó el acta: ${error.message}`,true);}
    finally {session.busy=false;updateControls(session);}
  }
  async function saveDraft() {
    const session=current;
    if (!session || session.busy || session.minutes?.status!=='draft') return;
    session.busy=true;session.manual=true;notify('Guardando correcciones...');updateControls(session);
    const values=Object.fromEntries(fields.map((key)=>[key,form.elements[key].value]));
    try {
      const {data,error}=await session.db.rpc('video_minutes_save',{
        p_meeting_id:session.meeting.id,p_summary:values.summary,p_topics:values.topics,
        p_agreements:values.agreements,p_commitments:values.commitments,p_pending:values.pending,
        p_notes:values.notes,p_revision:session.minutes.revision
      });
      if (error || !Number.isInteger(data)) throw error||new Error('Supabase no confirmó el guardado.');
      await load(session);session.manual=true;notify(`Cambios guardados, revisión ${data}.`);
    } catch(error) {session.manual=true;notify(`No se guardó: ${error.message}. Si otra persona cambió el acta, cierra y ábrela nuevamente.`,true);}
    finally {session.busy=false;updateControls(session);}
  }
  async function approveDraft() {
    const session=current;
    if (!session || session.busy || session.minutes?.status!=='draft') return;
    if (!window.confirm('¿Revisaste la transcripción y el borrador? Al aprobar, el acta quedará bloqueada. Guarda primero cualquier edición.')) return;
    session.busy=true;session.manual=true;notify('Registrando aprobación...');updateControls(session);
    try {
      const {data,error}=await session.db.rpc('video_minutes_approve',{
        p_meeting_id:session.meeting.id,p_revision:session.minutes.revision
      });
      if (error || data!==true) throw error||new Error('Acta modificada o resumen vacío; vuelve a revisar.');
      await load(session);session.manual=true;notify('Acta aprobada y bloqueada. Ya puedes exportarla.');
    } catch(error) {session.manual=true;notify(`No se aprobó: ${error.message}`,true);}
    finally {session.busy=false;updateControls(session);}
  }
  function documentHTML(session) {
    const m=session.meeting, act=session.minutes;
    const date=new Date(m.starts_at);
    const stamp=Number.isNaN(date.getTime())?'Fecha no disponible':new Intl.DateTimeFormat('es-CL',{dateStyle:'long',timeStyle:'short'}).format(date);
    const section=(key)=>`<h2>${escape(labels[key])}</h2><p>${escape(act[key] || empty).replaceAll('\n','<br>')}</p>`;
    return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Acta Domus Salud</title>` +
      `<style>body{font-family:Arial,sans-serif;color:#233748;margin:35px;line-height:1.55}`+
      `h1{color:#0d4263}h2{font-size:15px;color:#137a79;border-bottom:1px solid #ccd;margin-top:23px}`+
      `p{white-space:normal;font-size:11pt}small{color:#637982}</style></head><body>`+
      `<h1>DOMUS SALUD · ACTA DE REUNIÓN</h1><p><b>Reunión:</b> ${escape(m.title)}</p>`+
      `<p><b>Fecha:</b> ${escape(stamp)}</p><p><b>Invitados:</b> ${escape(session.people.map(participantName).join(', '))}</p>`+
      `<p><b>Estado:</b> ${escape(act.status==='approved'?'Aprobada':'Borrador')}</p>`+
      `${fields.map(section).join('')}`+
      `<hr><small>Documento revisado y aprobado por administración. Basado en ${act.source_segments} fragmentos de transcripción. La IA puede cometer errores.</small></body></html>`;
  }
  function fileName(session,extension) {
    const title=session.meeting.title.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9_-]+/g,'-').slice(0,45);
    return `Acta_Domus_${title||'reunion'}.${extension}`;
  }
  function exportWord() {
    const session=current;
    if (!session || session.minutes?.status!=='approved') return;
    if (!window.DomusDocx?.makeDocx) {session.manual=true;notify('No se cargó el generador Word. Actualiza la página.',true);return;}
    const m=session.meeting,act=session.minutes,date=new Date(m.starts_at);
    const stamp=Number.isNaN(date.getTime())?'Fecha no disponible':new Intl.DateTimeFormat('es-CL',{dateStyle:'long',timeStyle:'short'}).format(date);
    const blob=window.DomusDocx.makeDocx({title:m.title,date:stamp,
      participants:session.people.map(participantName).join(', '),sections:act,sourceSegments:act.source_segments});
    const url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download=fileName(session,'docx');document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),5000);
  }
  function exportPDF() {
    const session=current;
    if (!session || session.minutes?.status!=='approved') return;
    const popup=window.open('','_blank');
    if (!popup) {session.manual=true;notify('Autoriza la ventana emergente para imprimir o guardar como PDF.',true);return;}
    popup.document.open();popup.document.write(documentHTML(session));popup.document.close();
    popup.focus();setTimeout(()=>popup.print(),350);
    session.manual=true;notify('En la ventana de impresión selecciona «Guardar como PDF».');
  }
  root.querySelectorAll('[data-video-minutes-close]').forEach((b)=>b.addEventListener('click',close));
  agree.addEventListener('click',()=>void consent(true));
  reject.addEventListener('click',()=>void consent(false));
  generate.addEventListener('click',()=>void generateDraft());
  save.addEventListener('click',()=>void saveDraft());
  approve.addEventListener('click',()=>void approveDraft());
  form.addEventListener('input',()=>{if(current)updateControls(current);});
  word.addEventListener('click',exportWord);
  pdf.addEventListener('click',exportPDF);
  root.querySelector('[data-video-minutes-refresh]').addEventListener('click',async ()=>{
    const session=current;if(!session||session.busy)return;
    try {await load(session);}catch(error){session.manual=true;notify(`Error al actualizar: ${error.message}`,true);}
  });
  window.DomusMeetingMinutes={open,close};
})();
