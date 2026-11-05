const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const app = fs.readFileSync('js/app.js', 'utf8');
const html = fs.readFileSync('web.html', 'utf8');
const fn = app.match(/function getPatientEpisodes\(patientId\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(fn, 'No se encontró getPatientEpisodes');
function episodes(items, patient) {
  const ctx = {
    getPatientEvolutions: id => items.filter(e => e.patientId === id),
    isPatientVisitType: type => type === 'Visita a paciente',
    isProlongedMedicalVisit: (type, visit) => type === 'Cuidados Prolongados' && ['Visita Médica', 'Visita TENS', 'Visita Enfermería'].includes(visit),
  };
  vm.createContext(ctx);
  vm.runInContext(`${fn}\nthis.result = getPatientEpisodes(${JSON.stringify(patient)})`, ctx);
  return Array.from(ctx.result, e => e.id);
}
test('selector incluye episodios iniciales médicos convencionales y prolongados', () => {
  const items = [
    {id:'tens',patientId:'p1',visitType:'Cuidados Prolongados',specificProcedure:'Visita TENS',visitFormMode:'Nuevo Episodio',visitDate:'2026-11-05'},
    {id:'enf',patientId:'p1',visitType:'Cuidados Prolongados',specificProcedure:'Visita Enfermería',episodeKind:'new',visitDate:'2026-11-06'},
    {id:'med',patientId:'p1',visitType:'Cuidados Prolongados',specificProcedure:'Visita Médica',visitFormMode:'Nuevo Episodio',visitDate:'2026-11-07'},
    {id:'original',patientId:'p1',visitType:'Visita a paciente',visitFormMode:'Nuevo Episodio',visitDate:'2026-11-08'},
    {id:'follow',patientId:'p1',visitType:'Cuidados Prolongados',specificProcedure:'Visita TENS',episodeKind:'followup',visitFormMode:'Seguimiento de Episodio anterior'},
    {id:'kine',patientId:'p1',visitType:'Cuidados Prolongados',specificProcedure:'Kinesiologia',episodeKind:'care'},
    {id:'other',patientId:'p2',visitType:'Cuidados Prolongados',specificProcedure:'Visita TENS',visitFormMode:'Nuevo Episodio'},
  ];
  assert.deepEqual(episodes(items, 'p1'), ['tens','enf','med','original']);
});
test('guardado valida que episodio padre pertenece al mismo paciente y es inicial', () => {
  assert.equal((app.match(/!getPatientEpisodes\(patientId\)\.some\(\(episode\) => episode\.id === parentEpisode\.id\)/g) || []).length,2);
});
test('web descarga JS actualizado para evitar caché de Fase 6.1', () => {
  assert.match(html, /js\/app\.js\?v=2026-11-05-fase64-multiprofesional-psicologia/);
});
