const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert');
const test = require('node:test');
const root = path.join(__dirname, '..');
const calendar = fs.readFileSync(path.join(root, 'js', 'video-calendar.js'), 'utf8');
const sql = fs.readFileSync(path.join(root, 'supabase', '2026-09-24-fase52-deduplicar-miembros.sql'), 'utf8');

test('roster prefers admin/auth identity for duplicate admin+professional names', () => {
  assert.match(calendar, /function personScore\(info\)/);
  assert.match(calendar, /info\.role === 'admin'/);
  assert.match(calendar, /adminProfessional\.has\('admin'\).*adminProfessional\.has\('professional'\)/s);
  assert.match(calendar, /auth_user_id/);
});

test('phase 5.2 SQL deactivates professional duplicate without deleting history identity', () => {
  assert.match(sql, /p\.role = 'professional'/);
  assert.match(sql, /a\.role = 'admin'/);
  assert.match(sql, /SET active=false/);
  assert.doesNotMatch(sql, /DELETE FROM public\.video_members/i);
});
