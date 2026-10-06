/* Domus Salud · Invitados Fase 3. Cada invitado recibe identidad y secreto de sesión
 * propios. El enlace compartido NO da por sí solo permiso para usar funciones internas.
 * Jamás se expone service_role ni información clínica en este navegador.
 */
(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const secret = hash.get('token');
  const validSecret = typeof secret === 'string' && /^[a-f0-9]{64}$/i.test(secret);
  const welcome = $('[data-guest-welcome]');
  const preview = $('[data-guest-preview]');
  const meetingInfo = $('[data-guest-meeting]');
  const form = $('[data-guest-form]');
  const joinButton = $('[data-guest-join]');
  const roomPanel = $('[data-guest-room]');
  const roomStatus = $('[data-room-status]');
  const participantHost = $('[data-guest-participants]');
  const audioHost = $('[data-guest-audio-host]');
  const screenBox = $('[data-guest-screens]');
  const screens = $('[data-guest-screens-grid]');
  const fullscreen = $('[data-guest-fullscreen]');
  const micButton = $('[data-guest-mic]');
  const cameraButton = $('[data-guest-camera]');
  const blurButton = $('[data-guest-blur]');
  const devices = $('[data-guest-devices]');
  const input = $('[data-guest-input]');
  const output = $('[data-guest-output]');
  const deviceInfo = $('[data-guest-device-info]');
  const shareButton = $('[data-guest-share]');
  const chatHistory = $('[data-guest-chat-history]');
  const chatForm = $('[data-guest-chat-form]');
  const chatInput = $('[data-guest-chat-input]');
  const chatSend = $('[data-guest-chat-send]');
  const chatState = $('[data-guest-chat-state]');
  const consents = $('[data-guest-consents]');
  const consentAccept = $('[data-guest-consent-accept]');
  const consentDecline = $('[data-guest-consent-decline]');
  const transcriptStart = $('[data-guest-transcript-start]');
  const transcriptStop = $('[data-guest-transcript-stop]');
  const transcriptState = $('[data-guest-transcript-state]');
  const transcriptHistory = $('[data-guest-transcript-history]');
  const minutesPanel = $('[data-guest-minutes-panel]');
  const minutesForm = $('[data-guest-minutes-form]');
  const minutesState = $('[data-guest-minutes-state]');
  const minutesRefresh = $('[data-guest-minutes-refresh]');
  const minutesSave = $('[data-guest-minutes-save]');
  const minuteFields = ['summary','topics','agreements','commitments','pending','notes'];
  const encoder = new TextEncoder(); const decoder = new TextDecoder();
  const chatTopic = 'domus.chat.notice.v1';
  let room = null; let guest = null; let blurModule = null; let blurred = false;
  let lease = null; let shareTimer = null; let stoppingShare = false;
  let pollTimer = null; let loadingChat = false; let loadingTranscript = false; let busyTranscript = false;
  let loadingMinutes = false; let guestMinutes = null;
  const tiles = new Map(); const shares = new Map();
  const remoteCameras = new Map(); const remoteAudios = new Map();
  const state = (message) => { roomStatus.textContent = message; };
  const isScreen = (pub) => pub?.source === window.LivekitClient?.Track?.Source?.ScreenShare;
  const isCamera = (pub) => pub?.source === window.LivekitClient?.Track?.Source?.Camera;

  async function request(action, additional = {}) {
    const response = await fetch('/api/video-guests', { method:'POST', cache:'no-store',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action,secret,...(guest ? {identity:guest.identity,sessionToken:guest.sessionToken} : {}),...additional}) });
    const value = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(value.error || 'No fue posible validar la invitación.');
    return value;
  }
  async function load() {
    if (!validSecret) { preview.textContent='Enlace incorrecto. Solicita una invitación válida.';return; }
    try {
      const result=await request('preview');
      $('[data-guest-title]').textContent=result.meeting.title;
      $('[data-guest-date]').textContent=new Date(result.meeting.startsAt).toLocaleString('es-CL',{dateStyle:'full',timeStyle:'short'});
      meetingInfo.hidden=false; form.hidden=false;
      preview.textContent='Invitación válida. Ingresa con tu nombre durante el horario de la reunión.';
    } catch(error){preview.textContent=error.message;}
  }
  function tile(identity,name) {
    if (tiles.has(identity)) return tiles.get(identity);
    const node=document.createElement('article');node.className='participant';
    const media=document.createElement('div');media.className='media';
    const title=document.createElement('span');title.textContent=name||'Participante';
    node.append(media,title);participantHost.append(node);tiles.set(identity,node);return node;
  }
  function refreshScreens(){
    const count=shares.size;screenBox.hidden=!count;
    screens.dataset.count=String(Math.min(count,2));
    roomPanel.dataset.sharing=String(count>0);
    if (!count)screenBox.classList.remove('theater-mode');
    fullscreen.textContent=screenBox.classList.contains('theater-mode') || document.fullscreenElement===screenBox
      ? 'Salir de vista ampliada' : (typeof screenBox.requestFullscreen==='function'?'Pantalla completa':'Ampliar vista');
  }
  function attachScreen(track,person,local=false){
    const existing=shares.get(person.identity);
    if (existing?.track===track)return;
    if (!existing&&shares.size>=2)return;
    if (existing){existing.track.detach().forEach(el=>el.remove());existing.node.remove();shares.delete(person.identity);}
    const node=document.createElement('div');node.className='screen-tile';
    const video=track.attach();video.autoplay=true;video.playsInline=true;if(local)video.muted=true;
    const label=document.createElement('strong');label.textContent=`Pantalla de ${person.name||'participante'}`;
    node.append(video,label);screens.append(node);shares.set(person.identity,{node,track});refreshScreens();
  }
  function removeScreen(person,track){
    if(!person)return;const entry=shares.get(person.identity);
    if(!entry||(track&&entry.track!==track))return;
    entry.track.detach().forEach(el=>el.remove());entry.node.remove();shares.delete(person.identity);refreshScreens();
  }
  function attach(track,publication,participant){
    if(!participant||participant.isAgent)return;
    if(isScreen(publication)){attachScreen(track,participant);return;}
    if(track.kind==='audio'){
      if(remoteAudios.get(track.sid||track)===track)return;
      const element=track.attach();element.autoplay=true;remoteAudios.set(track.sid||track,track);
      audioHost.append(element);return;
    }
    if(!isCamera(publication))return;
    const existing=remoteCameras.get(participant.identity);
    if(existing?.track===track)return; // TrackSubscribed + inventario inicial: nunca duplicar.
    if(existing)existing.track.detach().forEach(el=>el.remove());
    const element=track.attach();element.autoplay=true;element.playsInline=true;
    tile(participant.identity,participant.name).querySelector('.media').replaceChildren(element);
    remoteCameras.set(participant.identity,{track,element});
  }
  function detach(track,publication,participant){
    if(isScreen(publication)){removeScreen(participant,track);return;}
    if(track.kind==='audio')remoteAudios.delete(track.sid||track);
    else if(participant&&remoteCameras.get(participant.identity)?.track===track)remoteCameras.delete(participant.identity);
    track.detach().forEach(element=>element.remove());
  }
  function localCamera(){
    if(!room)return null;
    return [...room.localParticipant.videoTrackPublications.values()].find(pub=>isCamera(pub)&&pub.track)?.track||null;
  }
  function updateLocal(){
    if(!room)return;
    const local=room.localParticipant;
    const media=tile(local.identity,`${local.name||'Yo'} (tú)`).querySelector('.media');
    const cameraTrack=localCamera();
    if(!cameraTrack){media.replaceChildren();delete media.dataset.trackSid;}
    else if(media.dataset.trackSid!==(cameraTrack.sid||'camera')||!media.firstElementChild){
      cameraTrack.detach().forEach(el=>el.remove());
      const video=cameraTrack.attach();video.muted=true;video.playsInline=true;
      media.replaceChildren(video);media.dataset.trackSid=cameraTrack.sid||'camera';
    }
    micButton.textContent=local.isMicrophoneEnabled?'Silenciar micrófono':'Activar micrófono';
    cameraButton.textContent=local.isCameraEnabled?'Apagar cámara':'Activar cámara';
    blurButton.disabled=!local.isCameraEnabled||!cameraTrack;
    blurButton.textContent=blurred?'Quitar desenfoque':'Difuminar fondo';
  }
  function updateLocalScreens(){
    if(!room)return;
    const local=room.localParticipant;
    const pub=[...local.videoTrackPublications.values()].find(p=>p.track&&isScreen(p));
    if(pub)attachScreen(pub.track,local,true);else removeScreen(local);
    shareButton.textContent=pub?'Dejar de compartir':'Compartir pantalla';
  }
  async function releaseShare(){
    if(shareTimer){clearInterval(shareTimer);shareTimer=null;}
    const old=lease;lease=null;
    if(old&&guest){try{await request('share-release',{lease:old});}catch(_){/* Caduca automáticamente */}}
  }
  async function stopShare(){
    if(stoppingShare)return;stoppingShare=true;
    try{if(room?.localParticipant.isScreenShareEnabled)await room.localParticipant.setScreenShareEnabled(false);}
    catch(error){state(`Compartir pantalla: ${error.message}`);}
    finally{await releaseShare();updateLocalScreens();stoppingShare=false;}
  }
  function monitorShare(current){
    if(shareTimer)clearInterval(shareTimer);
    let failures=0;
    shareTimer=setInterval(async()=>{
      if(room!==current||!lease)return;
      if(!current.localParticipant.isScreenShareEnabled){await releaseShare();updateLocalScreens();return;}
      try{
        const result=await request('share-touch',{lease});
        if(!result.ok){state('Se perdió el cupo para compartir pantalla.');await stopShare();}
        else failures=0;
      }catch(_){if(++failures>=2){state('Sin control de cupos. Deteniendo pantalla por seguridad.');await stopShare();}}
    },10000);
  }
  async function exit(){
    if(pollTimer){clearInterval(pollTimer);pollTimer=null;}
    try{await stopShare();}catch(_){}
    const old=room;room=null;
    if(old)try{await old.disconnect();}catch(_){}
    for(const entry of shares.values()){entry.track.detach().forEach(el=>el.remove());entry.node.remove();}
    shares.clear();tiles.forEach(node=>node.remove());tiles.clear();
    remoteCameras.clear();remoteAudios.clear();audioHost.replaceChildren();refreshScreens();
    blurred=false;devices.hidden=true;guest=null;guestMinutes=null;minutesForm?.reset();roomPanel.hidden=true;welcome.hidden=false;
    form.hidden=false;joinButton.disabled=false;
    preview.textContent='Saliste de la reunión. Puedes reingresar con el enlace si sigue vigente.';
  }
  form.addEventListener('submit',async(event)=>{
    event.preventDefault();if(room||joinButton.disabled)return;
    joinButton.disabled=true;preview.textContent='Verificando invitación y conectando…';
    try{
      if(!window.LivekitClient?.Room)throw new Error('No se cargó LiveKit. Actualiza la página.');
      const result=await request('join',{name:String(new FormData(form).get('guestName')||'').trim()});
      if(!result.sessionToken||!result.identity)throw new Error('El servidor no entregó una sesión válida.');
      guest={identity:result.identity,sessionToken:result.sessionToken,meetingId:result.meetingId};
      const client=window.LivekitClient;const nextRoom=new client.Room({adaptiveStream:true,dynacast:true});room=nextRoom;
      nextRoom.on(client.RoomEvent.TrackSubscribed,attach);
      nextRoom.on(client.RoomEvent.TrackUnsubscribed,detach);
      nextRoom.on(client.RoomEvent.ParticipantConnected,person=>{if(!person.isAgent)tile(person.identity,person.name);});
      nextRoom.on(client.RoomEvent.ParticipantDisconnected,person=>{
        removeScreen(person);tiles.get(person.identity)?.remove();tiles.delete(person.identity);
        remoteCameras.delete(person.identity);
      });
      nextRoom.on(client.RoomEvent.LocalTrackPublished,()=>{updateLocal();updateLocalScreens();});
      nextRoom.on(client.RoomEvent.LocalTrackUnpublished,publication=>{
        updateLocal();updateLocalScreens();
        if(isScreen(publication)&&lease&&!stoppingShare)void releaseShare();
        if(isCamera(publication)){blurred=false;updateLocal();}
      });
      nextRoom.on(client.RoomEvent.Disconnected,()=>{if(room===nextRoom)void exit();});
      nextRoom.on(client.RoomEvent.MediaDevicesChanged,()=>{if(!devices.hidden)void refreshDevices();});
      nextRoom.on(client.RoomEvent.DataReceived,(_bytes,_person,_kind,topic)=>{
        if(topic===chatTopic)void refreshChat();
      });
      if(typeof nextRoom.registerTextStreamHandler==='function'){
        nextRoom.registerTextStreamHandler('domus.transcription',async reader=>{
          try{await reader.readAll();}catch(_){}
          if(room===nextRoom)void refreshTranscript();
        });
      }
      await nextRoom.connect(result.url,result.token);
      if(room!==nextRoom)throw new Error('La sala se desconectó.');
      $('[data-room-title]').textContent=result.title;
      tile(nextRoom.localParticipant.identity,`${nextRoom.localParticipant.name||'Yo'} (tú)`);
      for(const person of nextRoom.remoteParticipants.values()){
        if(person.isAgent)continue;tile(person.identity,person.name);
        for(const pub of person.trackPublications.values())if(pub.track&&pub.isSubscribed)attach(pub.track,pub,person);
      }
      welcome.hidden=true;roomPanel.hidden=false;
      shareButton.disabled=typeof navigator.mediaDevices?.getDisplayMedia!=='function';
      if(shareButton.disabled)shareButton.title='Este navegador no permite capturar la pantalla; prueba Chrome o Edge en computador.';
      try{await nextRoom.localParticipant.enableCameraAndMicrophone();state('Conectado. Cámara y micrófono habilitados.');}
      catch(_){state('Conectado. Habilita cámara y micrófono con los controles.');}
      updateLocal();updateLocalScreens();
      await Promise.allSettled([refreshChat(),refreshTranscript(),refreshMinutes()]);
      pollTimer=setInterval(()=>{if(room===nextRoom&&!document.hidden){void refreshChat();void refreshTranscript();}},4000);
    }catch(error){if(room)await exit();preview.textContent=error.message;joinButton.disabled=false;}
  });
  $('[data-guest-leave]').addEventListener('click',()=>void exit());
  micButton.addEventListener('click',async()=>{
    if(!room)return;micButton.disabled=true;
    try{await room.localParticipant.setMicrophoneEnabled(!room.localParticipant.isMicrophoneEnabled);updateLocal();}
    catch(error){state(`Micrófono: ${error.message}`);}finally{micButton.disabled=false;}
  });
  cameraButton.addEventListener('click',async()=>{
    if(!room)return;cameraButton.disabled=true;
    try{const enabled=!room.localParticipant.isCameraEnabled;await room.localParticipant.setCameraEnabled(enabled);
      if(!enabled)blurred=false;updateLocal();}
    catch(error){state(`Cámara: ${error.message}`);}finally{cameraButton.disabled=false;}
  });
  blurButton.addEventListener('click',async()=>{
    const track=localCamera();if(!track)return;blurButton.disabled=true;
    try{
      if(blurred){await track.stopProcessor();blurred=false;state('Desenfoque desactivado.');}
      else{
        blurModule||=await import('https://cdn.jsdelivr.net/npm/@livekit/track-processors@0.8.1/+esm');
        if(!blurModule.supportsBackgroundProcessors?.())throw new Error('El navegador no admite desenfoque.');
        await track.setProcessor(blurModule.BackgroundProcessor({mode:'background-blur',blurRadius:12}));
        blurred=true;state('Desenfoque aplicado antes de enviar cámara.');
      }
    }catch(error){state(`Desenfoque: ${error.message}`);}finally{updateLocal();}
  });
  async function refreshDevices(){
    if(!room)return;
    for(const [kind,select] of [['audioinput',input],['audiooutput',output]]){
      const supported=kind==='audioinput'||typeof HTMLMediaElement!=='undefined'&&'setSinkId' in HTMLMediaElement.prototype;
      select.disabled=!supported;if(!supported){select.replaceChildren(new Option('No disponible',''));continue;}
      try{
        const list=await window.LivekitClient.Room.getLocalDevices(kind);
        const previous=select.value;select.replaceChildren(new Option('Predeterminado',''));
        list.forEach((device,i)=>select.append(new Option(device.label||`Dispositivo ${i+1}`,device.deviceId)));
        if([...select.options].some(option=>option.value===previous))select.value=previous;
        else if(room.getActiveDevice?.(kind))select.value=room.getActiveDevice(kind);
      }catch(error){deviceInfo.textContent=error.message;}
    }
  }
  $('[data-guest-devices-button]').addEventListener('click',async()=>{
    if(!room)return;devices.hidden=!devices.hidden;if(!devices.hidden)await refreshDevices();
  });
  for(const [kind,select] of [['audioinput',input],['audiooutput',output]]){
    select.addEventListener('change',async()=>{
      if(!room)return;select.disabled=true;
      try{await room.switchActiveDevice(kind,select.value||'default');deviceInfo.textContent='Dispositivo seleccionado.';}
      catch(error){deviceInfo.textContent=`No se pudo cambiar: ${error.message}`;}
      finally{select.disabled=kind==='audiooutput'&&!(typeof HTMLMediaElement!=='undefined'&&'setSinkId'in HTMLMediaElement.prototype);}
    });
  }
  shareButton.addEventListener('click',async()=>{
    if(!room||!guest)return;shareButton.disabled=true;
    try{
      if(room.localParticipant.isScreenShareEnabled){await stopShare();return;}
      if(typeof navigator.mediaDevices?.getDisplayMedia!=='function')throw new Error('Compartir pantalla no está disponible en este navegador.');
      const result=await request('share-claim');if(!result.lease)throw new Error('No se pudo reservar un cupo.');
      lease=result.lease;
      try{await room.localParticipant.setScreenShareEnabled(true);}
      catch(error){await releaseShare();throw error;}
      updateLocalScreens();monitorShare(room);state('Compartiendo pantalla. Queda disponible como máximo un cupo adicional.');
    }catch(error){state(`Pantalla: ${error.message}`);}
    finally{updateLocalScreens();shareButton.disabled=typeof navigator.mediaDevices?.getDisplayMedia!=='function';}
  });
  fullscreen.addEventListener('click',async()=>{
    if(!shares.size)return;
    if(screenBox.classList.contains('theater-mode')){screenBox.classList.remove('theater-mode');refreshScreens();return;}
    if(typeof screenBox.requestFullscreen!=='function'){
      screenBox.classList.add('theater-mode');refreshScreens();return;
    }
    try{
      if(document.fullscreenElement===screenBox&&document.exitFullscreen)await document.exitFullscreen();
      else await screenBox.requestFullscreen();
    }catch(_){screenBox.classList.add('theater-mode');state('Vista ampliada activada: el navegador no admite pantalla completa nativa.');}
    refreshScreens();
  });
  document.addEventListener('fullscreenchange',refreshScreens);
  function renderChat(messages){
    const oldLast=chatHistory.lastElementChild?.dataset.id;
    const newest=messages[messages.length-1]?.id;
    if(oldLast===newest&&chatHistory.children.length===messages.length)return;
    chatHistory.replaceChildren();
    if(!messages.length){chatHistory.textContent='Todavía no hay mensajes.';return;}
    for(const item of messages){
      const entry=document.createElement('article');entry.className='guest-chat-entry';entry.dataset.id=item.id;
      const name=document.createElement('strong');name.textContent=item.name||'Participante';
      const message=document.createElement('p');message.textContent=item.body;
      entry.append(name,message);chatHistory.append(entry);
    }
    chatHistory.scrollTop=chatHistory.scrollHeight;
  }
  async function refreshChat(){
    if(!room||!guest||loadingChat)return;loadingChat=true;
    try{const result=await request('chat-read');if(room)renderChat(result.messages||[]);}
    catch(error){chatState.textContent=`Chat: ${error.message}`;}
    finally{loadingChat=false;}
  }
  chatForm.addEventListener('submit',async(event)=>{
    event.preventDefault();if(!room||!guest||chatSend.disabled)return;
    const body=chatInput.value.trim();if(!body||body.length>4000)return;
    chatSend.disabled=true;
    try{
      const saved=await request('chat-send',{body});if(!saved.id)throw new Error('No se confirmó el guardado.');
      chatInput.value='';chatState.textContent='Mensaje guardado en Supabase.';
      try{await room.localParticipant.publishData(encoder.encode(JSON.stringify({type:'chat-saved',meetingId:guest.meetingId,id:saved.id})),
        {reliable:true,topic:chatTopic});}catch(_){/* sincronización periódica */}
      await refreshChat();
    }catch(error){chatState.textContent=`No se pudo enviar: ${error.message}`;}
    finally{chatSend.disabled=false;}
  });
  function renderMinutes(data){
    guestMinutes=data||null;
    if(!minutesForm||!data)return;
    for(const key of minuteFields)minutesForm.elements[key].value=data[key]||'';
    const approved=data.status==='approved';
    for(const key of minuteFields)minutesForm.elements[key].readOnly=approved;
    minutesSave.disabled=approved;
    minutesState.textContent=approved?`Acta aprobada · revisión ${data.revision}. Solo lectura.`:`Borrador compartido · revisión ${data.revision}.`;
  }
  async function refreshMinutes(){
    if(!room||!guest||loadingMinutes||!minutesForm)return;loadingMinutes=true;
    minutesRefresh.disabled=true;
    try{const result=await request('minutes-open');if(room&&result.minutes)renderMinutes(result.minutes);}
    catch(error){minutesState.textContent=`Acta: ${error.message}`;}
    finally{loadingMinutes=false;minutesRefresh.disabled=false;}
  }
  minutesPanel?.addEventListener('toggle',()=>{if(minutesPanel.open)void refreshMinutes();});
  minutesRefresh?.addEventListener('click',()=>void refreshMinutes());
  minutesForm?.addEventListener('submit',async(event)=>{
    event.preventDefault();if(!room||!guest||!guestMinutes||loadingMinutes||guestMinutes.status==='approved')return;
    loadingMinutes=true;minutesSave.disabled=true;minutesState.textContent='Guardando acta...';
    try{
      const payload={revision:guestMinutes.revision};
      for(const key of minuteFields)payload[key]=minutesForm.elements[key].value;
      const result=await request('minutes-save',payload);
      guestMinutes.revision=result.revision;
      minutesState.textContent=`Acta guardada · revisión ${result.revision}.`;
      loadingMinutes=false;
      await refreshMinutes();
    }catch(error){minutesState.textContent=`No se guardó: ${error.message}`;}
    finally{loadingMinutes=false;minutesSave.disabled=guestMinutes?.status==='approved';}
  });
  function renderTranscript(data){
    const choices=data.consents||[];
    const own=choices.find(entry=>entry.id===guest?.identity)?.accepted;
    const ready=choices.length>0&&choices.every(entry=>entry.accepted===true);
    consents.replaceChildren();
    for(const person of choices){
      const line=document.createElement('div');line.className='guest-consent-line';
      line.textContent=`${person.name||'Participante'}: ${person.accepted===true?'Autorizó':person.accepted===false?'No autorizó':'Pendiente'}`;
      consents.append(line);
    }
    const active=data.status==='active'||data.status==='starting';
    consentAccept.disabled=busyTranscript||own===true;
    consentDecline.disabled=busyTranscript||own===false;
    transcriptStart.disabled=busyTranscript||active||!ready;
    transcriptStop.disabled=busyTranscript||!active;
    if(!busyTranscript)transcriptState.textContent=active?'Transcripción en curso. Puedes detenerla.':
      ready?'Todos autorizaron. Puedes iniciar la transcripción.':'Transcripción detenida: falta consentimiento de una o más personas.';
    const segments=data.segments||[];
    transcriptHistory.replaceChildren();
    if(!segments.length){transcriptHistory.textContent='Todavía no hay texto transcrito.';return;}
    for(const segment of segments){
      const entry=document.createElement('article');entry.className='guest-chat-entry';
      const who=document.createElement('strong');who.textContent=segment.name||'Participante';
      const message=document.createElement('p');message.textContent=segment.text;
      entry.append(who,message);transcriptHistory.append(entry);
    }
    transcriptHistory.scrollTop=transcriptHistory.scrollHeight;
  }
  async function refreshTranscript(){
    if(!room||!guest||loadingTranscript)return;loadingTranscript=true;
    try{const result=await request('transcription-status');if(room&&result.state)renderTranscript(result.state);}
    catch(error){transcriptState.textContent=`Transcripción: ${error.message}`;}
    finally{loadingTranscript=false;}
  }
  for(const [button,accepted] of [[consentAccept,true],[consentDecline,false]]){
    button.addEventListener('click',async()=>{
      if(!room||!guest||busyTranscript)return;busyTranscript=true;button.disabled=true;
      try{
        await request('consent',{accepted});
        if(!accepted)await request('transcription-stop').catch(()=>{});
        transcriptState.textContent=accepted?'Autorización registrada.':'Autorización retirada; transcripción detenida.';
      }catch(error){transcriptState.textContent=error.message;}
      finally{busyTranscript=false;await refreshTranscript();}
    });
  }
  for(const [button,action] of [[transcriptStart,'transcription-start'],[transcriptStop,'transcription-stop']]){
    button.addEventListener('click',async()=>{
      if(!room||!guest||busyTranscript)return;busyTranscript=true;button.disabled=true;
      try{const result=await request(action);transcriptState.textContent=result.warning||
        (action==='transcription-start'?'Agente solicitado. Espera el texto.':'Transcripción detenida.');}
      catch(error){transcriptState.textContent=error.message;}
      finally{busyTranscript=false;await refreshTranscript();}
    });
  }
  void load();
})();
