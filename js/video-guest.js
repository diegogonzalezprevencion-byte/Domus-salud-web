/* Acceso externo SIN Supabase Auth ni lectura de chat, transcripciones, fichas o actas.
 * El secreto está únicamente en el fragmento #token=... (no se envía al servidor web ni CDN).
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
  const micButton = $('[data-guest-mic]');
  const cameraButton = $('[data-guest-camera]');
  const blurButton = $('[data-guest-blur]');
  const devices = $('[data-guest-devices]');
  const input = $('[data-guest-input]');
  const output = $('[data-guest-output]');
  const deviceInfo = $('[data-guest-device-info]');
  let room = null; let blurModule = null; let blurred = false;
  const tiles = new Map(); const shares = new Map();
  const state = (message) => { roomStatus.textContent = message; };
  const isScreen = (pub) => pub?.source === window.LivekitClient?.Track?.Source?.ScreenShare;
  const isCamera = (pub) => pub?.source === window.LivekitClient?.Track?.Source?.Camera;

  async function request(action, additional = {}) {
    const response = await fetch('/api/video-guests', { method:'POST', cache:'no-store',
      headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ action, secret, ...additional }) });
    const value = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(value.error || 'No se pudo verificar la invitación.');
    return value;
  }
  async function load() {
    if (!validSecret) { preview.textContent = 'Enlace incorrecto. Solicita una nueva invitación al organizador.'; return; }
    try {
      const result = await request('preview');
      $('[data-guest-title]').textContent = result.meeting.title;
      $('[data-guest-date]').textContent = new Date(result.meeting.startsAt).toLocaleString('es-CL', { dateStyle:'full', timeStyle:'short' });
      meetingInfo.hidden = false; form.hidden = false;
      preview.textContent = 'Invitación válida. Identifícate con tu nombre para ingresar durante el horario programado.';
    } catch (error) { preview.textContent = error.message; }
  }
  function tile(identity, name) {
    if (tiles.has(identity)) return tiles.get(identity);
    const node = document.createElement('article'); node.className = 'participant';
    const media = document.createElement('div'); media.className = 'media';
    const title = document.createElement('span'); title.textContent = name || 'Participante';
    node.append(media,title); participantHost.append(node); tiles.set(identity,node);
    return node;
  }
  function refreshScreens() {
    const count = shares.size;
    screenBox.hidden = !count;
    screens.dataset.count = String(Math.min(count,2));
    roomPanel.dataset.sharing = String(count > 0);
  }
  function attachScreen(track, person) {
    if (shares.has(person.identity)) return;
    if (shares.size >= 2) return;
    const node = document.createElement('div'); node.className='screen-tile';
    const video = track.attach(); video.autoplay = true; video.playsInline = true;
    const label = document.createElement('strong'); label.textContent = `Pantalla de ${person.name || 'participante'}`;
    node.append(video,label); screens.append(node);
    shares.set(person.identity,{node,track}); refreshScreens();
  }
  function removeScreen(person,track) {
    const entry = shares.get(person.identity);
    if (!entry || track && entry.track !== track) return;
    entry.track.detach().forEach((element) => element.remove()); entry.node.remove();
    shares.delete(person.identity); refreshScreens();
  }
  function attach(track,publication,participant) {
    if (!participant || participant.isAgent) return;
    if (isScreen(publication)) { attachScreen(track,participant); return; }
    const element = track.attach(); element.autoplay = true; element.playsInline = true;
    if (track.kind === 'audio') { audioHost.append(element); return; }
    tile(participant.identity,participant.name).querySelector('.media').append(element);
  }
  function detach(track,publication,participant) {
    if (isScreen(publication)) removeScreen(participant,track);
    track.detach().forEach((element) => element.remove());
  }
  function localCamera() {
    if (!room) return null;
    return [...room.localParticipant.videoTrackPublications.values()].find((publication) => isCamera(publication) && publication.track)?.track || null;
  }
  function updateLocal() {
    if (!room) return;
    const local = room.localParticipant;
    const media = tile(local.identity,`${local.name || 'Yo'} (tú)`).querySelector('.media');
    media.replaceChildren();
    for (const pub of local.videoTrackPublications.values()) if (isCamera(pub) && pub.track) {
      const video = pub.track.attach(); video.muted=true; video.playsInline=true; media.append(video);
    }
    micButton.textContent = local.isMicrophoneEnabled ? 'Silenciar micrófono' : 'Activar micrófono';
    cameraButton.textContent = local.isCameraEnabled ? 'Apagar cámara' : 'Activar cámara';
    blurButton.disabled = !local.isCameraEnabled || !localCamera();
    blurButton.textContent = blurred ? 'Quitar desenfoque' : 'Difuminar fondo';
  }
  async function exit() {
    const old = room; room = null;
    if (old) try { await old.disconnect(); } catch (_) {}
    tiles.forEach((node) => node.remove()); tiles.clear();
    shares.forEach((entry) => { entry.track.detach().forEach((element) => element.remove());entry.node.remove(); });
    shares.clear(); refreshScreens(); audioHost.replaceChildren();
    blurred=false; devices.hidden=true;
    roomPanel.hidden=true; welcome.hidden=false; form.hidden=false; joinButton.disabled=false;
    preview.textContent = 'Saliste de la videollamada. Podrás volver a entrar si el enlace y el horario siguen vigentes.';
  }
  form.addEventListener('submit',async (event) => {
    event.preventDefault(); if (room || joinButton.disabled) return;
    joinButton.disabled=true; preview.textContent='Verificando horario y conectando…';
    try {
      if (!window.LivekitClient?.Room) throw new Error('No se pudo cargar LiveKit. Actualiza la página.');
      const result = await request('join', { name: String(new FormData(form).get('guestName') || '').trim() });
      const client = window.LivekitClient;
      const nextRoom = new client.Room({adaptiveStream:true,dynacast:true});
      room = nextRoom;
      nextRoom.on(client.RoomEvent.TrackSubscribed,attach);
      nextRoom.on(client.RoomEvent.TrackUnsubscribed,detach);
      nextRoom.on(client.RoomEvent.ParticipantConnected,(person) => { if (!person.isAgent) tile(person.identity,person.name); });
      nextRoom.on(client.RoomEvent.ParticipantDisconnected,(person) => {
        removeScreen(person); tiles.get(person.identity)?.remove();tiles.delete(person.identity);
      });
      nextRoom.on(client.RoomEvent.LocalTrackPublished,updateLocal);
      nextRoom.on(client.RoomEvent.LocalTrackUnpublished,() => { blurred=false;updateLocal(); });
      nextRoom.on(client.RoomEvent.Disconnected,() => { if (room===nextRoom) void exit(); });
      nextRoom.on(client.RoomEvent.MediaDevicesChanged,() => { if (!devices.hidden) void refreshDevices(); });
      await nextRoom.connect(result.url,result.token);
      if (room!==nextRoom) throw new Error('La sala se desconectó.');
      $('[data-room-title]').textContent=result.title;
      tile(nextRoom.localParticipant.identity,`${nextRoom.localParticipant.name || 'Yo'} (tú)`);
      for (const person of nextRoom.remoteParticipants.values()) {
        if (person.isAgent) continue;
        tile(person.identity,person.name);
        for (const pub of person.trackPublications.values()) if (pub.track && pub.isSubscribed) attach(pub.track,pub,person);
      }
      welcome.hidden=true;roomPanel.hidden=false;
      try { await nextRoom.localParticipant.enableCameraAndMicrophone();state('Conectado. Cámara y micrófono habilitados.'); }
      catch (_) { state('Conectado. Autoriza cámara y micrófono en el navegador o usa los controles.'); }
      updateLocal();
    } catch (error) { if (room) await exit(); preview.textContent=error.message; joinButton.disabled=false; }
  });
  $('[data-guest-leave]').addEventListener('click',() => void exit());
  micButton.addEventListener('click',async () => {
    if (!room) return;micButton.disabled=true;
    try { await room.localParticipant.setMicrophoneEnabled(!room.localParticipant.isMicrophoneEnabled);updateLocal(); }
    catch (error) {state(`Micrófono: ${error.message}`);} finally{micButton.disabled=false;}
  });
  cameraButton.addEventListener('click',async () => {
    if (!room) return;cameraButton.disabled=true;
    try { const enabled=!room.localParticipant.isCameraEnabled;await room.localParticipant.setCameraEnabled(enabled);if (!enabled)blurred=false;updateLocal(); }
    catch (error){state(`Cámara: ${error.message}`);}finally{cameraButton.disabled=false;}
  });
  blurButton.addEventListener('click',async () => {
    const track=localCamera();if(!track)return;blurButton.disabled=true;
    try {
      if(blurred){await track.stopProcessor();blurred=false;state('Desenfoque desactivado.');}
      else{
        blurModule ||= await import('https://cdn.jsdelivr.net/npm/@livekit/track-processors@0.8.1/+esm');
        if(!blurModule.supportsBackgroundProcessors?.())throw new Error('Navegador no compatible con desenfoque.');
        await track.setProcessor(blurModule.BackgroundProcessor({mode:'background-blur',blurRadius:12}));
        blurred=true;state('Desenfoque aplicado antes de enviar la cámara.');
      }
    }catch(error){state(`Desenfoque: ${error.message}`);}finally{updateLocal();}
  });
  async function refreshDevices(){
    if(!room)return;
    for(const [kind,select] of [['audioinput',input],['audiooutput',output]]){
      const supported=kind==='audioinput'||typeof HTMLMediaElement!=='undefined'&&'setSinkId'in HTMLMediaElement.prototype;
      select.disabled=!supported;if(!supported){select.replaceChildren(new Option('No disponible',''));continue;}
      try{
        const list=await window.LivekitClient.Room.getLocalDevices(kind);
        const previous=select.value;select.replaceChildren(new Option('Predeterminado',''));
        for(const [i,device] of list.entries())select.append(new Option(device.label||`Dispositivo ${i+1}`,device.deviceId));
        if([...select.options].some((option)=>option.value===previous))select.value=previous;
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
  $('[data-guest-fullscreen]').addEventListener('click',async()=>{
    if(!shares.size)return;
    try{if(document.fullscreenElement===screenBox)await document.exitFullscreen();else await screenBox.requestFullscreen();}
    catch(error){state(`Pantalla completa: ${error.message}`);}
  });
  void load();
})();
