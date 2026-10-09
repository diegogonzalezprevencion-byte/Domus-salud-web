const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('web.html', 'utf8');
const app = fs.readFileSync('js/app.js', 'utf8');

test('Fase 6.1: acompañamiento adulto mayor reutiliza formulario Fono/TO', () => {
  assert.match(app, /\['Fonoaudiología \/ Terapeuta Ocupacional', 'Acompañamiento del adulto mayor'\]\.includes\(visitOption\)/);
  assert.match(html, /data-prolonged-fono-to-format/);
});

test('Fase 6.1: visita cuidador tiene signos vitales y tres textos de 5000 caracteres', () => {
  assert.match(app, /isProlongedCaregiverVisit/);
  assert.match(html, /data-prolonged-caregiver-format/);
  ['prolongedCaregiverPa','prolongedCaregiverFr','prolongedCaregiverTemp','prolongedCaregiverPam','prolongedCaregiverSat','prolongedCaregiverDolor','prolongedCaregiverFc','prolongedCaregiverFio2'].forEach((name) => assert.ok(html.includes(`name="${name}"`), `Falta ${name}`));
  ['prolongedCaregiverCondition','prolongedCaregiverCompletedActivities','prolongedCaregiverPendingActivities'].forEach((name) => assert.match(html, new RegExp(`name="${name}" maxlength="5000"`)));
});

test('Fase 6.1: TENS y Enfermería reutilizan la variante de Visita Médica', () => {
  assert.match(app, /\['Visita Médica', 'Visita TENS', 'Visita Enfermería'\]\.includes\(visitOption\)/);
});

test('Fase 6.1: los nuevos formularios usan firma por RUT y se pueden guardar', () => {
  assert.match(app, /isProlongedCaregiver && \(!evolution\.prolongedCaregiverCondition/);
  assert.match(app, /normalizeRutForComparison\(evolution\.visitSignatureRut\) !== normalizeRutForComparison\(current\.rut\)/);
  assert.match(app, /evolution\.objective = evolution\.prolongedCaregiverCondition/);
});
