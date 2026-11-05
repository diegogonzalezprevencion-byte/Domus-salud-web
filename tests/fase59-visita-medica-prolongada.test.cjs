const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('web.html', 'utf8');
const app = fs.readFileSync('js/app.js', 'utf8');

test('Fase 5.9: Visita Médica de Cuidados Prolongados usa formulario clínico', () => {
  assert.match(app, /isProlongedMedicalVisit\(attentionType, selectedVisitType\)/);
  assert.match(app, /hasAvailableForm = \(!isProlongedCare && hasPatientVisitForm\(selectedVisitType\)\) \|\| isProlongedCustomForm/);
});

test('Fase 5.9: variante prolongada oculta FiO2 respiratorio, sondas, PICC y ayudas técnicas', () => {
  assert.match(html, /data-standard-medical-only>FiO₂/);
  assert.match(html, /data-standard-medical-only><span>Sondas<\/span>/);
  assert.match(html, /data-standard-medical-only><span>PICC - VVP - Catéter<\/span>/);
  assert.match(html, /data-standard-medical-only><span>Prótesis dental<\/span>/);
  assert.match(html, /data-standard-medical-only><span>Prótesis auricular<\/span>/);
  assert.match(html, /data-standard-medical-only><span>Usa lentes<\/span>/);
});

test('Fase 5.9: incorpora Dispositivos Invasivos con tipo, ubicación y observaciones', () => {
  assert.match(html, /Dispositivos Invasivos/);
  assert.match(html, /name="newInvasiveDeviceType"/);
  assert.match(html, /name="newInvasiveDeviceLocation"/);
  assert.match(html, /name="newInvasiveDeviceObservations"/);
  assert.match(app, /newInvasiveDeviceObservations/);
});

test('Fase 5.9: formulario inicial del paciente incorpora prótesis y lentes como selección múltiple', () => {
  assert.match(html, /type="checkbox" name="dentalProsthesis"/);
  assert.match(html, /type="checkbox" name="hearingProsthesis"/);
  assert.match(html, /type="checkbox" name="usesGlasses"/);
  assert.match(app, /dentalProsthesis: formData\.get\('dentalProsthesis'\) \? 'Sí' : 'No'/);
});

test('Fase 5.9: firma de visita prolongada valida RUT contra profesional autenticado', () => {
  assert.match(app, /normalizeRutForComparison\(evolution\.visitSignatureRut\) !== normalizeRutForComparison\(current\.rut\)/);
  assert.match(app, /El RUT ingresado para la firma no coincide/);
  assert.match(html, /Debe coincidir con el RUT del profesional que está realizando esta visita/);
});
