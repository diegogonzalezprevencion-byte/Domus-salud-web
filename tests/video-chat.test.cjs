const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const script = fs.readFileSync(path.join(__dirname, '..', 'js/video-chat.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

class FakeElement {
  constructor() {
    this.dataset = {};
    this.hidden = false;
    this.disabled = false;
    this.textContent = '';
    this.value = '';
    this.children = [];
    this.listeners = new Map();
    this.scrollTop = 0;
    this.scrollHeight = 200;
    this.clientHeight = 200;
  }
  setAttribute(name, value) { this[name] = value; }
  addEventListener(name, listener) { this.listeners.set(name, listener); }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = [...nodes]; }
  requestSubmit() { const submit = this.listeners.get('submit'); submit?.({ preventDefault() {} }); }
  fire(name, payload = {}) { return this.listeners.get(name)?.(payload); }
}
function harness({ initial = [], failLoad = false, failSend = false, roomConnected = true } = {}) {
  const selectors = [
    '[data-video-chat]', '[data-video-call-main]', '[data-video-chat-toggle]',
    '[data-video-chat-close]', '[data-video-chat-more]', '[data-video-chat-history]',
    '[data-video-chat-messages]', '[data-video-chat-state]', '[data-video-chat-form]',
    '[data-video-chat-input]', '[data-video-chat-send]', '[data-video-chat-counter]'
  ];
  const ui = Object.fromEntries(selectors.map((selector) => [selector, new FakeElement()]));
  const events = new Map();
  const published = [];
  const rows = [...initial];
  const room = {
    state: roomConnected ? 'connected' : 'disconnected',
    on(name, listener) { events.set(name, listener); },
    off(name) { events.delete(name); },
    localParticipant: { async publishData(...args) { published.push(args); } }
  };
  const db = {
    calls: [],
    from(table) {
      assert.equal(table, 'video_chat_messages');
      const query = {
        select() { return this; },
        eq(column, value) { assert.equal(column, 'meeting_id'); this.meetingId = value; return this; },
        or(condition) { this.cursor = condition; return this; },
        order() { return this; },
        async limit(count) {
          if (failLoad) return { error: { message: 'Sin permiso RLS' } };
          let filtered = rows.filter((row) => row.meeting_id === this.meetingId);
          filtered.sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id));
          if (this.cursor) {
            const t = this.cursor.match(/^created_at\.lt\.([^,]+),and\(created_at\.eq\.[^,]+,id\.lt\.([^)]+)\)$/);
            assert.ok(t, `Cursor inesperado: ${this.cursor}`);
            filtered = filtered.filter((r) => r.created_at < t[1] || (r.created_at === t[1] && r.id < t[2]));
          }
          return { data: filtered.slice(0, count), error: null };
        }
      };
      return query;
    },
    async rpc(name, payload) {
      assert.equal(name, 'video_send_chat');
      db.calls.push(payload);
      if (failSend) return { data: null, error: { message: 'No autorizado' } };
      const id = `id-${rows.length + 1}`;
      rows.push({ id, meeting_id: payload.p_meeting_id, sender_id: 'admin:diego',
        body: payload.p_body, created_at: new Date(1000000 + rows.length * 1000).toISOString() });
      return { data: id, error: null };
    }
  };
  const fakeDocument = {
    hidden: false,
    querySelector(selector) { assert.equal(selector, '[data-video-call]'); return { querySelector(name) { assert.ok(ui[name], name); return ui[name]; } }; },
    createElement() { return new FakeElement(); }
  };
  const intervals = new Map();
  let nextInterval = 0;
  const sandbox = {
    document: fakeDocument,
    window: { LivekitClient: { RoomEvent: { DataReceived: 'data', Reconnected: 'reconnected' } } },
    TextEncoder, TextDecoder, Intl, Date, Map,
    setInterval(fn) { const id = ++nextInterval; intervals.set(id, fn); return id; },
    clearInterval(id) { intervals.delete(id); }
  };
  vm.runInNewContext(script, sandbox, { filename: 'video-chat.js' });
  const meeting = { id: 'meeting-1', participants: [
    { member_id: 'admin:diego', video_members: { display_name: 'Diego' } },
    { member_id: 'admin:cata', video_members: { display_name: 'Catalina' } }
  ] };
  const member = { id: 'admin:diego', display_name: 'Diego' };
  return { ui, db, rows, room, events, intervals, published, chat: sandbox.window.DomusVideoChat, meeting, member };
}

const tick = () => new Promise((resolve) => setImmediate(resolve));

test('El HTML incluye módulo de chat accesible, script de carga y botón para abrir/cerrar', () => {
  assert.ok(html.includes('data-video-chat-form'));
  assert.ok(html.includes('aria-label="Historial de mensajes"'));
  assert.ok(html.indexOf('js/video-chat.js?') < html.indexOf('js/video-call.js?'));
  assert.ok(html.includes('data-video-chat-toggle'));
});

test('Al entrar carga historial por reunión, etiqueta autores y permite cerrar y reabrir el panel', async () => {
  const t = harness({ initial: [{
    id: 'msg-1', meeting_id: 'meeting-1', sender_id: 'admin:cata', body: 'Buenas tardes',
    created_at: '2026-09-17T20:00:00.000Z'
  }] });
  await t.chat.start(t.room, t.meeting, t.db, t.member);
  assert.equal(t.ui['[data-video-chat-input]'].disabled, false);
  const entries = t.ui['[data-video-chat-messages]'].children;
  assert.equal(entries.length, 1);
  assert.equal(entries[0].children[0].children[0].textContent, 'Catalina');
  assert.equal(entries[0].children[1].textContent, 'Buenas tardes');
  t.ui['[data-video-chat-toggle]'].fire('click');
  assert.equal(t.ui['[data-video-chat]'].hidden, true);
  t.ui['[data-video-chat-toggle]'].fire('click');
  assert.equal(t.ui['[data-video-chat]'].hidden, false);
  t.chat.stop();
  assert.equal(t.intervals.size, 0);
  assert.equal(t.events.size, 0);
  assert.equal(t.ui['[data-video-chat-input]'].disabled, true);
});

test('Envío escribe mediante RPC segura y notifica por LiveKit solo después de guardar; no duplica mensaje', async () => {
  const t = harness();
  await t.chat.start(t.room, t.meeting, t.db, t.member);
  const input = t.ui['[data-video-chat-input]'];
  input.value = '  Hola Cata  ';
  input.fire('input');
  t.ui['[data-video-chat-form]'].requestSubmit();
  await tick(); await tick();
  assert.equal(t.db.calls.length, 1);
  assert.equal(t.db.calls[0].p_body, 'Hola Cata');
  assert.equal(t.db.calls[0].p_meeting_id, t.meeting.id);
  assert.equal(t.rows.length, 1);
  assert.equal(t.published.length, 1);
  const notice = JSON.parse(new TextDecoder().decode(t.published[0][0]));
  assert.equal(notice.meetingId, 'meeting-1');
  assert.ok(!JSON.stringify(notice).includes('Hola Cata'));
  assert.equal(t.ui['[data-video-chat-input]'].value, '');
  t.events.get('data')(t.published[0][0], null, null, 'domus.chat.notice.v1');
  await tick();
  assert.equal(t.ui['[data-video-chat-messages]'].children.length, 1);
  t.chat.stop();
});

test('Un fallo al guardar mantiene borrador, no publica a LiveKit y muestra error', async () => {
  const t = harness({ failSend: true });
  await t.chat.start(t.room, t.meeting, t.db, t.member);
  const input = t.ui['[data-video-chat-input]'];
  input.value = 'Mensaje no guardado'; input.fire('input');
  t.ui['[data-video-chat-form]'].requestSubmit();
  await tick();
  assert.equal(t.rows.length, 0);
  assert.equal(t.published.length, 0);
  assert.equal(input.value, 'Mensaje no guardado');
  assert.match(t.ui['[data-video-chat-state]'].textContent, /No se guardó/);
  t.chat.stop();
});

test('Sin lectura autorizada, el chat no habilita el envío ni cierra videollamada', async () => {
  const t = harness({ failLoad: true });
  await t.chat.start(t.room, t.meeting, t.db, t.member);
  assert.equal(t.ui['[data-video-chat-input]'].disabled, true);
  assert.match(t.ui['[data-video-chat-state]'].textContent, /Sin permiso RLS/);
  assert.equal(t.room.state, 'connected');
  t.chat.stop();
});

test('Los mensajes se renderizan como texto literal, nunca como HTML ejecutable', async () => {
  const t = harness({ initial: [{
    id: 'msg-1', meeting_id: 'meeting-1', sender_id: 'admin:cata',
    body: '<img src=x onerror=alert(1)>', created_at: '2026-09-17T20:00:00.000Z'
  }] });
  await t.chat.start(t.room, t.meeting, t.db, t.member);
  assert.equal(t.ui['[data-video-chat-messages]'].children[0].children[1].textContent, '<img src=x onerror=alert(1)>');
  assert.equal(t.ui['[data-video-chat-messages]'].children.length, 1);
  t.chat.stop();
});

test('No mezcla mensajes de distintas reuniones; al salir borra datos en memoria', async () => {
  const t = harness({ initial: [{
    id: 'secret', meeting_id: 'meeting-1', sender_id: 'admin:diego',
    body: 'Privado', created_at: '2026-09-17T20:00:00.000Z'
  }] });
  await t.chat.start(t.room, t.meeting, t.db, t.member);
  assert.equal(t.ui['[data-video-chat-messages]'].children.length, 1);
  t.chat.stop();
  const other = { ...t.meeting, id: 'meeting-2' };
  await t.chat.start(t.room, other, t.db, t.member);
  assert.equal(t.ui['[data-video-chat-messages]'].children[0].textContent, 'Todavía no hay mensajes. Inicia la conversación.');
  assert.equal(t.intervals.size, 1);
  t.chat.stop();
});

test('La agenda pasa el perfil validado a la videollamada y al salir se detiene el chat', () => {
  const call = fs.readFileSync(path.join(__dirname, '..', 'js/video-call.js'), 'utf8');
  const calendar = fs.readFileSync(path.join(__dirname, '..', 'js/video-calendar.js'), 'utf8');
  assert.ok(calendar.includes('DomusVideoCall.join(meeting, db, member)'));
  assert.ok(call.includes('window.DomusVideoChat?.stop()'));
  assert.ok(call.includes('window.DomusVideoChat.start(nextRoom, meeting, db, member)'));
  assert.ok(call.includes('.catch((error) => setStatus('));
  assert.ok(call.includes('await nextRoom.localParticipant.enableCameraAndMicrophone()'));
});
