const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..');
const js=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
const html=fs.readFileSync(path.join(root,'web.html'),'utf8');
test('Semáforo representa disponibilidad de medición y no cantidad',()=>{
  assert.match(js,/DASHBOARD_METRIC_ENABLED = Object\.freeze/);
  for(const x of ['visits','submissions','conversionRate','patientFormOpens','patientForms'])assert.match(js,new RegExp(x+':true'));
  for(const x of ['sessions','visitors','clicks','sectionViews','engagedSessions','whatsapp'])assert.match(js,new RegExp(x+':false'));
  assert.doesNotMatch(js,/const active=Number\(key===/);
  assert.match(js,/dashboardMeasurementStatus\(/);
  assert.match(js,/Medición inactiva \(solo datos históricos\)/);
});
test('Paneles reflejan capacidad de recopilar nuevos datos',()=>{
  assert.match(js,/'principales-clics-publicos-1':false/);
  assert.match(js,/'secciones-mas-exploradas-2':false/);
  assert.match(js,/'dispositivos-utilizados-4':true/);
  assert.match(js,/setDashboardPanelActivity\('actividad',true\)/);
});
test('Portada versiona código y explica indicadores',()=>{
  assert.match(html,/fase72-descripcion-opcional/);
  assert.match(html,/Punto verde = medición activa/);
});
