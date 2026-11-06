const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const js = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
test('Equipo directivo exige solo nombre y cargo', () => {
  assert.match(js, /if \(!name \|\| !role\)/);
  assert.doesNotMatch(js, /if \(!name \|\| !role \|\| !description\)/);
  assert.match(js, /Completa el nombre y el cargo antes de guardar/);
});
test('Descripción opcional y sin párrafo público vacío', () => {
  assert.match(js, /Descripción \(opcional\)/);
  assert.match(js, /String\(profile\.description \|\| ""\)\.trim\(\)/);
});
