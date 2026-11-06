const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const app = fs.readFileSync('js/app.js','utf8');
const html = fs.readFileSync('web.html','utf8');
const visits = app.match(/const PATIENT_VISIT_OPTIONS = \[([\s\S]*?)\];/)[1].match(/'[^']+'/g).map(x=>x.slice(1,-1));
test('Visita a paciente solo ofrece las tres opciones solicitadas',()=>{
  assert.deepEqual(visits,['Visita Médica','Visita Educador','Masoterapeuta']);
});
test('Educador y masoterapeuta no permiten guardar evoluciones incompletas',()=>{
  assert.match(app,/const PATIENT_VISIT_OPTIONS_WITHOUT_FORMS = \['Visita Educador', 'Masoterapeuta'\]/);
  assert.match(app,/if \(!hasPatientVisitForm\(evolution.specificProcedure\)\) \{/);
});
test('Visita Médica convencional reutiliza variante prolongada y firma con RUT',()=>{
  const context = {isPatientVisitType:type=>type==='Visita a paciente',isProlongedMedicalVisit:(type,visit)=>type==='Cuidados Prolongados'&&visit==='Visita Médica'};
  vm.createContext(context);
  const fn1=app.match(/function isPatientMedicalVisit\([\s\S]*?\n\}/)[0];
  const fn2=app.match(/function isSharedMedicalVisit\([\s\S]*?\n\}/)[0];
  vm.runInContext(fn1+'\n'+fn2,context);
  assert.equal(context.isSharedMedicalVisit('Visita a paciente','Visita Médica'),true);
  assert.equal(context.isSharedMedicalVisit('Cuidados Prolongados','Visita Médica'),true);
  assert.equal(context.isSharedMedicalVisit('Visita a paciente','Visita Educador'),false);
  assert.match(app,/const usesRutSignature = isProlongedCustomForm \|\| isPatientMedicalVisit/);
  assert.match(app,/if \(isPatientMedicalVisit\(evolution.visitType, evolution.specificProcedure\)\) \{/);
});
test('PDF actual usa dispositivos invasivos y registros históricos no se ocultan',()=>{
  const report=app.slice(app.indexOf('function newPatientVisitReportSection'),app.indexOf('function followupVisitReportSection'));
  assert.match(report,/isSharedMedicalVisit\(evolution.visitType, evolution.specificProcedure\)/);
  assert.match(app,/LEGACY_PATIENT_VISIT_FORM_OPTIONS.includes\(evolution.specificProcedure\)/);
  assert.match(html,/fase72-descripcion-opcional/);
});
