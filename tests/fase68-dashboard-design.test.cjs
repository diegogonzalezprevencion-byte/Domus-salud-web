const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'web.html'),'utf8');
const css=fs.readFileSync(path.join(root,'css','styles.css'),'utf8');
const js=fs.readFileSync(path.join(root,'js','app.js'),'utf8');
test('Navegación administrativa conserva siete pestañas y vínculos originales',()=>{
 const expected=['dashboard','administration','patients','professionals','video','testimonials','slides'];
 for(const tab of expected) assert.match(html,new RegExp('data-admin-tab="'+tab+'"'));
 assert.match(html,/class="domus-admin-sidebar"/);
 assert.match(html,/class="domus-admin-main"/);
 assert.match(js,/function switchAdminTab/);
});
test('KPI agrupados sin cambiar sus nombres de datos, ni sus consultas',()=>{
 const base=html.indexOf('domus-metric-active'); const inactive=html.indexOf('domus-metric-inactive');
 assert.ok(base>0&&inactive>base);
 const first=html.slice(base,inactive);
 const second=html.slice(inactive,html.indexOf('analytics-privacy-note',inactive));
 for(const key of ['visits','submissions','conversionRate','patientFormOpens','patientForms']) assert.match(first,new RegExp('data-stat="'+key+'"'));
 for(const key of ['sessions','visitors','clicks','sectionViews','engagedSessions','whatsapp']) assert.match(second,new RegExp('data-stat="'+key+'"'));
 assert.match(js,/setupDashboardCollapsiblePanels/);
 for(const selector of ['data-top-clicks-list','data-analytics-sections-list','data-analytics-monthly-rows','data-public-events-list']) assert.ok(html.includes(selector));
});
test('Estilos compactos y responsive solo para administración',()=>{
 assert.match(css,/Fase 6\.8/); assert.match(css,/domus-admin-sidebar/);
 assert.match(css,/dashboard-metric-card/);assert.match(css,/max-width:720px/);
 assert.match(html,/fase72-descripcion-opcional/);
});
