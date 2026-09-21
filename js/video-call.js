/* Domus Salud · Videollamadas. JWT emitido por Vercel, sala LiveKit y cupos Supabase.
 * El desenfoque se procesa en el navegador ANTES de enviarse por LiveKit; nunca es un filtro CSS.
 */
(() => {
  'use strict';
  const overlay = document.querySelector('[data-video-call]');
  if (!overlay) return;
  const $ = (selector) => overlay.querySelector(selector);
  const workspace = $('[data-video-workspace]');
  const grid = $('[data-video-call-grid]');
  const stage = $('[data-video-stage]');
  const stageGrid = $('[data-video-stage-grid]');
  const audioHost = $('[data-video-audio-host]');
  const fullscreen = $('[data-video-fullscreen]');
  const status = $('[data-video-call-status]');
  const mic = $('[data-video-mic]');
  const camera = $('[data-video-camera]');
  const screen = $('[data-video-screen]');
  const blurButton = $('[data-video-blur]');
  const devicesButton = $('[data-video-devices-toggle]');
  const devicesPanel = $('[data-video-devices-panel]');
  const input = $('[data-video-audio-input]');
  const output = $('[data-video-audio-output]');
  const deviceMessage = $('[data-video-device-status]');
  let room = null, joining = false, context = null;
  let shareLease = null, shareTimer = null, stoppingShare = false;
  let blurActive = false, blurTrack = null;
  let processorModule = null;
  const tiles = new Map();
  const screenTiles = new Map();
  const setStatus = (message) => { status.textContent = message; };
  const isScreen = (publication) => publication?.source === window.LivekitClient?.Track?.Source?.ScreenShare;
  const isCamera = (publication) => publication?.source === window.LivekitClient?.Track?.Source?.Camera;

  function tile(identity, name) {
    if (tiles.has(identity)) return tiles.get(identity);
    const node = document.createElement('div'); node.className = 'video-call-tile';
    const media = document.createElement('div'); media.className = 'video-call-media';
    const caption = document.createElement('span'); caption.textContent = name || 'Participante';
    node.append(media, caption); grid.append(node); tiles.set(identity, node);
    return node;
  }
  function refreshStage() {
    const count = screenTiles.size;
    stage.hidden = count === 0;
    workspace.dataset.sharing = count ? 'true' : 'false';
    stageGrid.dataset.count = String(Math.min(count, 2));
    fullscreen.disabled = count === 0 || typeof stage.requestFullscreen !== 'function';
  }
  function attachScreen(track, participant, local = false) {
    const id = participant.identity;
    const existing = screenTiles.get(id);
    if (existing?.track === track) return;
    if (!existing && screenTiles.size >= 2) {
      setStatus('Ya se muestran dos pantallas. El límite se controla al iniciar el compartido desde Domus Salud.');
      return;
    }
    if (existing) { existing.track.detach().forEach((el) => el.remove()); existing.node.remove(); screenTiles.delete(id); }
    const node = document.createElement('section'); node.className = 'video-screen-tile';
    const label = document.createElement('strong');
    label.textContent = `Pantalla de ${participant.name || (local ? 'ti' : 'participante')}`;
    const video = track.attach(); video.autoplay = true; video.playsInline = true;
    if (local) video.muted = true;
    node.append(video, label); stageGrid.append(node);
    screenTiles.set(id, { node, track }); refreshStage();
  }
  function removeScreen(participant, track) {
    if (!participant) return;
    const entry = screenTiles.get(participant.identity);
    if (!entry || (track && entry.track !== track)) return;
    entry.track.detach().forEach((el) => el.remove()); entry.node.remove();
    screenTiles.delete(participant.identity); refreshStage();
  }
  function attach(track, publication, participant) {
    if (!participant || participant.isAgent) return;
    if (isScreen(publication)) { attachScreen(track, participant); return; }
    const element = track.attach(); element.autoplay = true; element.playsInline = true;
    element.dataset.trackSid = track.sid || '';
    if (track.kind === 'audio') { audioHost.append(element); return; }
    const host = tile(participant.identity, participant.name).querySelector('.video-call-media');
    host.append(element);
  }
  function detach(track, publication, participant) {
    if (isScreen(publication)) removeScreen(participant, track);
    track.detach().forEach((element) => element.remove());
  }
  function localVideoTrack() {
    if (!room) return null;
    for (const pub of room.localParticipant.videoTrackPublications.values()) {
      if (pub.track && isCamera(pub)) return pub.track;
    }
    return null;
  }
  function renderLocal() {
    if (!room) return;
    const local = room.localParticipant;
    const node = tile(local.identity, `${local.name || 'Yo'} (tú)`);
    const host = node.querySelector('.video-call-media');
    host.replaceChildren();
    for (const publication of local.videoTrackPublications.values()) {
      if (publication.track && isCamera(publication)) {
        const video = publication.track.attach(); video.muted = true; video.playsInline = true; host.append(video);
      }
    }
    mic.textContent = local.isMicrophoneEnabled ? 'Silenciar micrófono' : 'Activar micrófono';
    camera.textContent = local.isCameraEnabled ? 'Apagar cámara' : 'Activar cámara';
    blurButton.disabled = !local.isCameraEnabled || !localVideoTrack();
    blurButton.textContent = blurActive ? 'Quitar desenfoque' : 'Difuminar fondo';
  }
  function renderLocalScreens() {
    if (!room) return;
    const local = room.localParticipant;
    const publication = [...local.videoTrackPublications.values()].find((p) => p.track && isScreen(p));
    if (publication) attachScreen(publication.track, local, true);
    else removeScreen(local);
    screen.textContent = publication ? 'Dejar de compartir' : 'Compartir pantalla';
  }
  async function releaseShare() {
    if (shareTimer) { clearInterval(shareTimer); shareTimer = null; }
    const lease = shareLease; shareLease = null;
    if (lease && context) {
      try { await context.db.rpc('video_screen_release', { p_meeting_id: context.meeting.id, p_lease_id: lease }); }
      catch (_) { /* El cupo caduca en Supabase en 35 s. */ }
    }
  }
  async function stopShare() {
    if (stoppingShare) return;
    stoppingShare = true;
    try {
      if (room?.localParticipant.isScreenShareEnabled) {
        await room.localParticipant.setScreenShareEnabled(false);
      }
    } catch (error) { setStatus(`No se pudo detener la pantalla: ${error.message}`); }
    finally {
      await releaseShare(); renderLocalScreens(); stoppingShare = false;
    }
  }
  function monitorShare(nextRoom) {
    if (shareTimer) clearInterval(shareTimer);
    let missed = 0;
    shareTimer = setInterval(async () => {
      if (room !== nextRoom || !shareLease) return;
      if (!nextRoom.localParticipant.isScreenShareEnabled) { await releaseShare(); renderLocalScreens(); return; }
      const lease = shareLease;
      try {
        const { data, error } = await context.db.rpc('video_screen_touch', {
          p_meeting_id: context.meeting.id, p_lease_id: lease
        });
        if (error || data !== true) {
          setStatus('Se perdió la reserva del cupo. Se detendrá la pantalla para respetar el límite.');
          await stopShare();
        } else missed = 0;
      } catch (_) {
        missed++;
        if (missed >= 2) {
          setStatus('Sin conexión con el control de cupos. Se detendrá la pantalla para evitar superar el límite.');
          await stopShare();
        }
      }
    }, 10000);
  }
  async function changeBlur() {
    const track = localVideoTrack();
    if (!track) throw new Error('Primero activa la cámara.');
    if (blurActive) {
      await track.stopProcessor();
      blurActive = false; blurTrack = null; renderLocal();
      setStatus('Desenfoque desactivado. Tu fondo vuelve a ser visible.');
      return;
    }
    if (!processorModule) {
      // Sólo se carga cuando el usuario solicita desenfocar. Nunca se envía el video al CDN.
      processorModule = await import('https://cdn.jsdelivr.net/npm/@livekit/track-processors@0.8.1/+esm');
    }
    if (!processorModule.supportsBackgroundProcessors?.()) {
      throw new Error('Este navegador no permite desenfocar el fondo. Prueba Chrome/Edge actualizado.');
    }
    const processor = processorModule.BackgroundProcessor({ mode: 'background-blur', blurRadius: 12 });
    await track.setProcessor(processor);
    blurTrack = track; blurActive = true; renderLocal();
    setStatus('Desenfoque activado en la cámara antes del envío.');
  }
  function availableDevices(kind) {
    return window.LivekitClient.Room.getLocalDevices(kind);
  }
  async function fillDevices(kind, element) {
    const previous = element.value;
    const devices = await availableDevices(kind);
    element.replaceChildren();
    const fallback = document.createElement('option'); fallback.value = ''; fallback.textContent = 'Predeterminado del sistema';
    element.append(fallback);
    devices.forEach((device, index) => {
      const option = document.createElement('option'); option.value = device.deviceId;
      option.textContent = device.label || `${kind === 'audioinput' ? 'Micrófono' : 'Altavoz'} ${index + 1}`;
      element.append(option);
    });
    if ([...element.options].some((o) => o.value === previous)) element.value = previous;
    else if (room?.getActiveDevice?.(kind)) element.value = room.getActiveDevice(kind);
  }
  async function refreshDevices() {
    if (!room) return;
    try {
      await fillDevices('audioinput', input);
      const supported = typeof HTMLMediaElement !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype;
      output.disabled = !supported;
      if (supported) await fillDevices('audiooutput', output);
      else { output.replaceChildren(new Option('No disponible en este navegador', '')); }
      deviceMessage.textContent = supported ? 'Puedes cambiar los dispositivos durante la llamada.' : 'El navegador no permite elegir la salida de audio.';
    } catch (error) { deviceMessage.textContent = `Dispositivos: ${error.message}`; }
  }
  async function leave() {
    window.DomusVideoChat?.stop();
    window.DomusTranscription?.stop();
    const previous = room; room = null;
    if (previous) {
      try { await previous.disconnect(); } catch (_) {}
    }
    await releaseShare(); context = null;
    blurActive = false; blurTrack = null;
    overlay.hidden = true; grid.replaceChildren(); stageGrid.replaceChildren(); audioHost.replaceChildren();
    tiles.clear(); screenTiles.clear(); refreshStage();
    devicesPanel.hidden = true; setStatus('Desconectado');
  }
  async function join(meeting, db, member) {
    if (joining || room) throw new Error('Ya existe una videollamada abierta.');
    if (!window.LivekitClient?.Room) throw new Error('El cliente LiveKit no se cargó. Actualiza la página.');
    joining = true; overlay.hidden = false;
    $('[data-video-call-title]').textContent = meeting.title;
    setStatus('Validando acceso y preparando sala...');
    try {
      const { data: { session }, error } = await db.auth.getSession();
      if (error || !session?.access_token) throw new Error('Tu sesión de Supabase venció. Vuelve a ingresar.');
      const response = await fetch('/api/video-token', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ meetingId: meeting.id }), cache: 'no-store'
      });
      const credentials = await response.json().catch(() => ({}));
      if (!response.ok || !credentials.token || !credentials.url) throw new Error(credentials.error || 'No fue posible obtener acceso a LiveKit.');
      const client = window.LivekitClient;
      const nextRoom = new client.Room({ adaptiveStream: true, dynacast: true });
      room = nextRoom; context = { meeting, db, member };
      nextRoom.on(client.RoomEvent.TrackSubscribed, attach);
      nextRoom.on(client.RoomEvent.TrackUnsubscribed, detach);
      nextRoom.on(client.RoomEvent.ParticipantDisconnected, (participant) => {
        removeScreen(participant);
        tiles.get(participant.identity)?.remove(); tiles.delete(participant.identity);
      });
      nextRoom.on(client.RoomEvent.LocalTrackPublished, () => { renderLocal(); renderLocalScreens(); });
      nextRoom.on(client.RoomEvent.LocalTrackUnpublished, (publication) => {
        renderLocal(); renderLocalScreens();
        if (isScreen(publication) && shareLease && !stoppingShare) void releaseShare();
        if (isCamera(publication)) { blurActive = false; blurTrack = null; renderLocal(); }
      });
      nextRoom.on(client.RoomEvent.Disconnected, () => { if (room === nextRoom) void leave(); });
      nextRoom.on(client.RoomEvent.MediaDevicesChanged, () => { if (!devicesPanel.hidden) void refreshDevices(); });
      setStatus('Conectando con LiveKit...');
      await nextRoom.connect(credentials.url, credentials.token);
      tile(nextRoom.localParticipant.identity, `${nextRoom.localParticipant.name || 'Yo'} (tú)`);
      for (const participant of nextRoom.remoteParticipants.values()) {
        if (participant.isAgent) continue;
        tile(participant.identity, participant.name);
        for (const publication of participant.trackPublications.values()) {
          if (publication.track && publication.isSubscribed) attach(publication.track, publication, participant);
        }
      }
      renderLocalScreens();
      setStatus('Conectado. Activa cámara y micrófono cuando quieras.');
      // Chat y transcripción existentes conservan el mismo objeto Room.
      if (window.DomusVideoChat) {
        try {
          void window.DomusVideoChat.start(nextRoom, meeting, db, member)
            .catch((err) => setStatus(`Videollamada conectada. Chat: ${err.message || 'temporalmente no disponible'}.`));
        } catch (err) { setStatus(`Videollamada conectada. Chat: ${err.message || 'temporalmente no disponible'}.`); }
      }
      if (window.DomusTranscription) {
        void window.DomusTranscription.start(nextRoom, meeting, db, member)
          .catch((err) => setStatus(`Videollamada conectada. Transcripción: ${err.message || 'no disponible'}.`));
      }
      try { await nextRoom.localParticipant.enableCameraAndMicrophone(); }
      catch (_) { setStatus('Conectado. Permite cámara/micrófono en el navegador o usa los botones.'); }
      renderLocal();
    } catch (error) { await leave(); throw error; }
    finally { joining = false; }
  }
  overlay.querySelectorAll('[data-video-leave]').forEach((button) => button.addEventListener('click', () => void leave()));
  mic.addEventListener('click', async () => {
    if (!room) return;
    mic.disabled = true;
    try { await room.localParticipant.setMicrophoneEnabled(!room.localParticipant.isMicrophoneEnabled); renderLocal(); }
    catch (error) { setStatus(`Micrófono: ${error.message}`); }
    finally { mic.disabled = false; }
  });
  camera.addEventListener('click', async () => {
    if (!room) return;
    camera.disabled = true;
    try {
      const enabled = !room.localParticipant.isCameraEnabled;
      await room.localParticipant.setCameraEnabled(enabled);
      if (!enabled) { blurActive = false; blurTrack = null; }
      renderLocal();
    } catch (error) { setStatus(`Cámara: ${error.message}`); }
    finally { camera.disabled = false; }
  });
  blurButton.addEventListener('click', async () => {
    if (!room) return;
    blurButton.disabled = true; setStatus('Procesando desenfoque de la cámara...');
    try { await changeBlur(); }
    catch (error) { setStatus(`Fondo: ${error.message}`); }
    finally { renderLocal(); }
  });
  devicesButton.addEventListener('click', async () => {
    if (!room) return;
    devicesPanel.hidden = !devicesPanel.hidden;
    devicesButton.setAttribute('aria-expanded', String(!devicesPanel.hidden));
    if (!devicesPanel.hidden) await refreshDevices();
  });
  for (const [kind, select] of [['audioinput', input], ['audiooutput', output]]) {
    select.addEventListener('change', async () => {
      if (!room) return;
      select.disabled = true;
      try {
        await room.switchActiveDevice(kind, select.value || 'default');
        deviceMessage.textContent = kind === 'audioinput' ? 'Micrófono seleccionado.' : 'Salida de audio seleccionada.';
      } catch (error) { deviceMessage.textContent = `No se pudo cambiar el dispositivo: ${error.message}`; }
      finally { select.disabled = kind === 'audiooutput' && !(typeof HTMLMediaElement !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype); }
    });
  }
  screen.addEventListener('click', async () => {
    if (!room || !context) return;
    screen.disabled = true;
    try {
      if (room.localParticipant.isScreenShareEnabled) { await stopShare(); return; }
      // Cupo atómico en Supabase ANTES de solicitar permiso de pantalla.
      const { data, error } = await context.db.rpc('video_screen_claim', { p_meeting_id: context.meeting.id });
      if (error || !data) throw new Error(error?.message || 'No se pudo reservar un cupo de pantalla.');
      shareLease = data;
      try { await room.localParticipant.setScreenShareEnabled(true); }
      catch (err) { await releaseShare(); throw err; }
      renderLocalScreens(); monitorShare(room);
      setStatus('Compartiendo pantalla. Cupo reservado en Supabase.');
    } catch (error) { setStatus(`Pantalla: ${error.message}`); }
    finally { renderLocalScreens(); screen.disabled = false; }
  });
  fullscreen.addEventListener('click', async () => {
    if (!screenTiles.size) return;
    try {
      if (document.fullscreenElement === stage) await document.exitFullscreen();
      else await stage.requestFullscreen();
    } catch (error) { setStatus(`Pantalla completa: ${error.message}`); }
  });
  refreshStage();
  window.DomusVideoCall = { join, leave };
})();
