const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('web.html', 'utf8');
const app = fs.readFileSync('js/app.js', 'utf8');

test('Fase 6.0: Kinesiología prolongada tiene selector, signos vitales y tres campos de 5000 caracteres', () => {
  assert.match(html, /data-prolonged-kinesiology-format/);
  assert.match(html, /name="prolongedKineType" value="Kinesiología motora"/);
  assert.match(html, /name="prolongedKineType" value="Kinesiología Respiratoria"/);
  ['prolongedKinePa','prolongedKineFr','prolongedKineTemp','prolongedKinePam','prolongedKineSat','prolongedKineDolor','prolongedKineFc','prolongedKineFio2'].forEach((name) => assert.ok(html.includes(`name="${name}"`), `Falta ${name}`));
  ['prolongedKinePhysicalExam','prolongedKineInterventions','prolongedKineIndications'].forEach((name) => assert.match(html, new RegExp(`name="${name}" maxlength="5000"`)));
});

test('Fase 6.0: Fonoaudiología / TO tiene tres campos de 5000 caracteres', () => {
  assert.match(html, /data-prolonged-fono-to-format/);
  ['prolongedFonoCondition','prolongedFonoInterventions','prolongedFonoIndications'].forEach((name) => assert.match(html, new RegExp(`name="${name}" maxlength="5000"`)));
});

test('Fase 6.0: ambos formularios se habilitan y validan firma por RUT', () => {
  assert.match(app, /isProlongedKinesiologyVisit/);
  assert.match(app, /isProlongedFonoToVisit/);
  assert.match(app, /hasProlongedCareForm/);
  assert.match(app, /normalizeRutForComparison\(evolution\.visitSignatureRut\) !== normalizeRutForComparison\(current\.rut\)/);
  assert.match(app, /prolongedKinePhysicalExam/);
  assert.match(app, /prolongedFonoCondition/);
});
