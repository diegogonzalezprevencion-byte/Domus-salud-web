const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('web.html', 'utf8');
const app = fs.readFileSync('js/app.js', 'utf8');

test('Fase 5.6: Cuidados Prolongados aparece como tipo de atención', () => {
  assert.match(html, /<option>Cuidados Prolongados<\/option>/);
  assert.match(app, /const PROLONGED_CARE_TYPE = 'Cuidados Prolongados'/);
});

test('Fase 5.6: incluye los siete tipos de visita solicitados', () => {
  [
    'Visita Médica',
    'Kinesiologia',
    'Fonoaudiología / Terapeuta Ocupacional',
    'Acompañamiento del adulto mayor',
    'Visita TENS',
    'Visita Enfermería',
    'Visita Cuidador'
  ].forEach((visit) => assert.ok(app.includes(`'${visit}'`), `Falta ${visit}`));
});

test('Fase 6.0: Cuidados Prolongados conserva pendientes excepto formularios habilitados', () => {
  assert.match(app, /hasProlongedCareForm/);
  assert.match(app, /Boolean\(selectedVisitType\) && !isProlongedCustomForm/);
  assert.match(app, /Estamos trabajando en este formulario/);
  assert.match(html, /Estamos trabajando en este formulario/);
});
