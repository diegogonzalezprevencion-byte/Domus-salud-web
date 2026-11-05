const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const app = fs.readFileSync('js/app.js','utf8');
const html = fs.readFileSync('web.html','utf8');
test('Atención psicológica disponible en ambos selectores con formulario pendiente',()=>{
 assert.equal((html.match(/<option>Atención Psicológica<\/option>/g)||[]).length,2);
 assert.match(html,/data-psychology-pending/);
 assert.match(app,/if \(evolution.visitType === 'Atención Psicológica'\)/);
});
test('asignación múltiple con seleccionar todos y compatibilidad con profesional anterior',()=>{
 assert.match(html,/data-patient-select-all-professionals/);
 assert.match(html,/data-patient-professionals-options/);
 assert.match(app,/professionalIds: selectedProfessionalIds/);
 assert.match(app,/getSelectedPatientProfessionalIds\(\)/);
 const extract = app.match(/function getPatientProfessionalIds\([\s\S]*?\n\}/)[0];
 const other = app.match(/function isProfessionalAssignedToPatient\([\s\S]*?\n\}/)[0];
 const ctx={};vm.createContext(ctx); vm.runInContext(extract+'\n'+other,ctx);
 assert.equal(ctx.isProfessionalAssignedToPatient({professionalId:'p1'},'p1'),true);
 assert.equal(ctx.isProfessionalAssignedToPatient({professionalId:'p1',professionalIds:['p1','p2']},'p2'),true);
 assert.equal(ctx.isProfessionalAssignedToPatient({professionalId:'p1',professionalIds:['p1','p2']},'p3'),false);
 assert.equal(ctx.isProfessionalAssignedToPatient({professionalId:'p3',professionalIds:['p1','p2']},'p3'),true);
});
test('acceso y grabación de evoluciones verifica profesionales asignados',()=>{
 assert.match(app,/if \(current.type === 'service'\) return isProfessionalAssignedToPatient\(patient, current.id\)/);
 assert.match(app,/if \(!canProfessionalAccessPatient\(current, patient\)\)/);
 assert.match(app,/if \(!canProfessionalAccessPatient\(getCurrentProfessional\(\), getPatientById\(patientId\)\)\) return/);
 assert.match(app,/getPatientEpisodes\(patientId\)/);
});
