const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const app=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
const html=fs.readFileSync(path.join(root,'web.html'),'utf8');
const css=fs.readFileSync(path.join(root,'css/styles.css'),'utf8');
const sql=fs.readFileSync(path.join(root,'supabase/FASE66-ACTIVIDAD-PROFESIONAL.sql'),'utf8');
test('Fase 6.6 telefono de emergencia en creacion y ficha clinica',()=>{
 assert.match(html,/name="emergencyPhone"/);
 assert.match(app,/patientForm\.elements\.emergencyPhone\.value/);
 assert.match(app,/emergencyPhone: generalData\.emergencyPhone/);
 assert.match(app,/Teléfono de emergencia/);
});
test('Fase 6.6 paneles y tarjetas individuales plegables con estado dinamico',()=>{
 assert.match(app,/setupDashboardCollapsiblePanels/);
 assert.match(app,/dashboard-metric-toggle/);
 assert.match(app,/updateDashboardPanelActivity\(metrics,data\)/);
 assert.match(css,/dashboard-metric-collapsed/);
 assert.match(css,/dashboard-activity-dot\.is-active/);
});
test('Fase 6.6 ingresos profesionales sin identificadores ni administradores en RPC',()=>{
 assert.match(app,/audience:'professional',eventType:'professional_login'/);
 assert.match(app,/professional_id:null,professional_username:null/);
 assert.match(sql,/e\.audience='professional'/);
 assert.match(sql,/e\.audience='public' AND e\.event_type='page_view'/);
 assert.doesNotMatch(sql,/e\.audience IN \('public','patient','admin'\)/);
});
