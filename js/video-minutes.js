/* Domus Salud · Actas sin IA: plantilla protegida por RPC y edición humana.
   Las transcripciones se consultan desde Supabase bajo RLS. No se transmiten a servicios externos. */
(() => {
  'use strict';
  const root = document.querySelector('[data-admin-view="video"]');
  if (!root) return;
  const $ = (selector) => root.querySelector(selector);
  const dialog = $('[data-video-minutes-dialog]');
  const title = $('[data-video-minutes-title]');
  const state = $('[data-video-minutes-state]');
  const transcriptLoad = $('[data-video-minutes-transcript-load]');
  const transcriptList = $('[data-video-minutes-transcript-list]');
  const transcriptStatus = $('[data-video-minutes-transcript-status]');
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
  const empty = 'No informado en el acta.';
  let current=null;
  let nonce=0;
  const escape = (value) => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;')
    .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
  function notify(text,error=false) { state.textContent=text; state.dataset.error=String(error); }
  function participantName(row) { return row.video_members?.display_name || row.member_id; }
  function updateControls(session) {
    if (session!==current) return;
    const locked=!!session.busy;
    const row=session.minutes;
    const draft=row?.status==='draft';
    const approved=row?.status==='approved';
    const active=session.runStatus!=='stopped';
    generate.disabled=locked || active || (!session.segmentCount && !session.external) || approved;
    generate.hidden=session.member.role!=='admin';
    generate.textContent=draft?'Recrear plantilla (borra los cambios)':'Crear plantilla de acta';
    form.hidden=!row;
    for (const key of fields) {
      const field=form.elements[key];
      field.readOnly=locked || approved;
    }
    save.hidden=!draft;
    approve.hidden=!draft;
    save.disabled=locked;
    approve.disabled=locked || !form.elements.summary.value.trim() || !!(row && fields.some((key)=>form.elements[key].value!==(row[key]||'')));  
    word.hidden=!approved;
    pdf.hidden=!approved;
    badge.textContent=approved?'APROBADA':draft?'BORRADOR • REVISIÓN OBLIGATORIA':'SIN ACTA';
    badge.dataset.status=approved?'approved':'draft';
    source.textContent=row ? `${session.external ? 'Acta manual de reunión externa (sin transcripción)' : `Fuente: ${row.source_segments} fragmentos transcritos`} · revisión ${row.revision} · ${approved?'Aprobada y bloqueada':'Editable hasta aprobar'}`
      : session.external ? 'Acta manual sin transcripción: redacta los puntos a partir de tus notas.'
        : `Fuente: ${session.segmentCount} fragmentos transcritos · ${active?'Detén la transcripción antes de generar':'Sin documento generado'}`;
    if (!session.manual) {
      if (approved) notify('Acta aprobada. Puedes descargarla; ya no se modifica desde esta versión.');
      else if (draft) notify('Plantilla disponible. Consulta la transcripción y completa las secciones antes de aprobar.');
      else if (active) notify('Detén primero la transcripción y espera a que se guarden los fragmentos finales.');
      else if (session.external) notify('Esta reunión tiene invitados externos. Puedes crear y aprobar un acta manual sin transcripción.');
      else if (!session.segmentCount) notify('Esta reunión no tiene transcripción guardada.');
      else notify('Crea una plantilla gratuita. La aplicación no interpreta acuerdos ni redacta resúmenes automáticamente.');
    }
  }
  async function load(session) {
    const [m,r,s,g]=await Promise.all([
      session.db.from('video_meeting_minutes').select('*').eq('meeting_id',session.meeting.id).maybeSingle(),
      session.db.from('video_transcription_runs').select('status').eq('meeting_id',session.meeting.id).maybeSingle(),
      session.db.from('video_transcript_segments').select('id',{count:'exact',head:true}).eq('meeting_id',session.meeting.id),
      session.db.rpc('video_guest_meeting_enabled', { p_meeting_id:session.meeting.id })
    ]);
    const error=m.error||r.error||s.error||g.error;
    if (error) throw error;
    if (session!==current) return;
    session.minutes=m.data||null;
    session.runStatus=r.data?.status||'stopped';
    session.segmentCount=s.count||0;
    session.external=g.data===true;
    for (const key of fields) form.elements[key].value=session.minutes?.[key]||'';
    session.manual=false;
    updateControls(session);
  }
  function close() { nonce++; dialog.hidden=true; current=null; }
  async function open(meeting,member,db) {
    close();
    const id=++nonce;
    const session={meeting,member,db,people:meeting.participants||[],minutes:null,
      segmentCount:0,external:false,runStatus:'stopped',busy:true,manual:true};
    current=session; dialog.hidden=false;
    transcriptList.replaceChildren(); transcriptStatus.textContent='Presiona «Cargar transcripción» para consultar el registro original.';
    title.textContent=`Acta · ${meeting.title}`;
    form.hidden=true;
    notify('Consultando transcripción y autorizaciones...');
    updateControls(session);
    try { await load(session); session.busy=false;updateControls(session); }
    catch (error) { session.busy=false; if (nonce===id) { session.manual=true; notify(`No se pudo abrir el acta: ${error.message}. ¿Ejecutaste el SQL de actas?`,true); generate.disabled=true; } }
  }
  async function generateDraft() {
    const session=current;
    if (!session || session.busy || session.runStatus!=='stopped' || (!session.segmentCount && !session.external) || session.minutes?.status==='approved') return;
    const replaceDraft=!!session.minutes;
    if (replaceDraft && !window.confirm('¿Recrear la plantilla? Se perderán TODOS los cambios realizados en el borrador actual.')) return;
    session.busy=true;session.manual=true;notify('Creando plantilla en Supabase...');updateControls(session);
    try {
      const {data,error}=await session.db.rpc('video_minutes_create_template',{
        p_meeting_id:session.meeting.id,p_replace_draft:replaceDraft,
        p_expected_revision:replaceDraft?session.minutes.revision:null
      });
      if (error || !Number.isInteger(data)) throw error||new Error('Supabase no confirmó la plantilla.');
      await load(session);
      session.manual=true;
      notify(session.external ? 'Plantilla manual creada. Redacta y revisa los campos; esta reunión no admite transcripción.' :
        `Plantilla creada con referencia a ${session.segmentCount} fragmentos. Consulta la transcripción y redacta los campos.`);
    } catch(error){session.manual=true;notify(`No se creó el acta: ${error.message}`,true);}
    finally {session.busy=false;updateControls(session);}
  }
  async function showTranscript() {
    const session=current;
    if (!session || session.busy) return;
    transcriptLoad.disabled=true;
    transcriptStatus.textContent='Cargando transcripción original desde Supabase...';
    transcriptList.replaceChildren();
    try {
      let rows=[];
      for(let from=0;from<5000;from+=500){
        const {data,error}=await session.db.from('video_transcript_segments')
          .select('id,member_id,starts_at,content').eq('meeting_id',session.meeting.id)
          .order('starts_at',{ascending:true}).order('id',{ascending:true}).range(from,from+499);
        if(error) throw error;
        if(session!==current) return;
        rows.push(...(data||[]));
        if((data||[]).length<500) break;
        if(from===4500) throw new Error('Hay más de 5.000 segmentos; consulta la transcripción completa en Supabase. No se ha presentado un texto truncado como completo.');
      }
      if(!rows.length){transcriptStatus.textContent='No hay fragmentos guardados.';return;}
      const names=new Map(session.people.map(p=>[p.member_id,participantName(p)]));
      const fragment=document.createDocumentFragment();
      for(const entry of rows){
        const box=document.createElement('div');box.className='video-minutes-transcript-entry';
        const header=document.createElement('strong');
        const d=new Date(entry.starts_at);
        header.textContent=`${names.get(entry.member_id)||'Participante'} · ${Number.isNaN(d.getTime())?'Sin hora':d.toLocaleString('es-CL')}`;
        const content=document.createElement('span');content.textContent=entry.content;
        box.append(header,content);fragment.append(box);
      }
      transcriptList.replaceChildren(fragment);
      transcriptStatus.textContent=`Transcripción original: ${rows.length} fragmentos mostrados. No se envía a ningún servicio de IA.`;
    }catch(error){transcriptStatus.textContent=`No se pudo mostrar la transcripción completa: ${error.message}`;transcriptList.replaceChildren();}
    finally{transcriptLoad.disabled=false;}
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
    if (!window.confirm(session.external ? '¿Revisaste tus notas y el borrador manual? El acta quedará bloqueada. Guarda primero los cambios.' : '¿Revisaste la transcripción y el borrador? Al aprobar, el acta quedará bloqueada. Guarda primero cualquier edición.')) return;
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
      `<hr><small>Documento redactado, revisado y aprobado por administración. ${session.external ? 'Acta manual de reunión con invitados externos; sin transcripción.' : `Fuente disponible en Domus Salud: ${act.source_segments} fragmentos transcritos.`} No se utilizó IA para redactarlo.</small></body></html>`;
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
  transcriptLoad.addEventListener('click',()=>void showTranscript());
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
