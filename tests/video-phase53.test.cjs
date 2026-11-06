const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert');
const test = require('node:test');
const root = path.join(__dirname, '..');
const calendar = fs.readFileSync(path.join(root, 'js', 'video-calendar.js'), 'utf8');
const sql = fs.readFileSync(path.join(root, 'supabase', '2026-09-24-fase53-roster-interno.sql'), 'utf8');
const web = fs.readFileSync(path.join(root, 'web.html'), 'utf8');

test('phase 5.3 roster uses internal-members RPC and explicitly rejects guest identities', () => {
  assert.match(calendar, /db\.rpc\('video_registered_members'\)/);
  assert.match(calendar, /\.not\('id', 'like', 'guest:%'\)/);
  assert.match(calendar, /startsWith\('guest:'\)/);
});

test('phase 5.3 SQL returns active internal members and excludes guest identities', () => {
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.video_registered_members\(\)/);
  assert.match(sql, /m\.id NOT LIKE 'guest:%'/);
  assert.match(sql, /m\.role IN \('admin','professional'\)/);
  assert.match(sql, /GRANT EXECUTE[\s\S]*TO authenticated/);
});

test('phase 5.3 bumps calendar cache version', () => {
  assert.match(web, /video-calendar\.js\?v=2026-09-24-fase53/);
});
