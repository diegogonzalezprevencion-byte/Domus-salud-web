const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'web.html'),'utf8');
const js=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
const sql=fs.readFileSync(path.join(root,'supabase/2026-09-21-dashboard-publico-historico.sql'),'utf8');
test('Elimina bloque antiguo actividad administradores sin quitar dashboard',()=>{
 assert.doesNotMatch(html,/Actividad administradores/);
 assert.match(html,/data-admin-view="dashboard"/);
});
test('Meses disponibles y filtro multiselección, totalidad por defecto',()=>{
 assert.match(html,/data-analytics-month-options/);
 assert.match(html,/data-analytics-select-all/);
 assert.match(html,/data-analytics-select-none/);
 assert.match(js,/analyticsSelectedMonths = null/);
 assert.match(js,/p_months:analyticsSelectedMonths===null\?null:\[\.\.\.analyticsSelectedMonths\]/);
});
test('Última actividad tiene fechas y paginación',()=>{
 for(const key of ['analytics-date-from','analytics-date-to','analytics-activity-form','analytics-prev','analytics-next']) assert.match(html,new RegExp(key));
 assert.match(js,/domus_analytics_activity/);
 assert.match(sql,/p_from date DEFAULT NULL,p_to date DEFAULT NULL/);
});
test('Totales se agregan en Supabase y no con límite 2.500 filas ni 30 días',()=>{
 assert.match(js,/domus_analytics_dashboard/);
 assert.doesNotMatch(js,/\.limit\(2500\)/);
 assert.doesNotMatch(js,/fetchAnalyticsEvents\(30\)/);
 assert.match(sql,/count\(\*\) FILTER \(WHERE event_type='page_view'\)/);
});
test('El público no puede descargar la tabla de eventos desde Supabase',()=>{
 assert.match(sql,/DROP POLICY IF EXISTS "Analytics events read dashboard"/);
 assert.match(sql,/REVOKE SELECT ON public.analytics_events FROM PUBLIC, anon, authenticated/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public.domus_analytics_dashboard\(text\[\]\) TO authenticated/);
 assert.match(sql,/m\.auth_user_id = \(SELECT auth\.uid\(\)\) AND m\.role = 'admin' AND m\.active/);
});
test('Estadística pública voluntaria y sin RUT, texto libre ni query-string',()=>{
 assert.match(html,/data-analytics-consent/);
 assert.match(html,/data-analytics-preferences/);
 assert.match(js,/analyticsPreference\(\) === 'accepted'/);
 assert.match(js,/visitor_id: null/);
 assert.match(js,/referrer: null/);
 assert.match(js,/metadata: audience === 'public' \|\| audience === 'patient' \? \{\} : metadata/);
 assert.doesNotMatch(js,/metadata: \{\s*service: data\.service/);
});
test('Recuentos de formularios de pacientes no llevan identidad ni sesiones',()=>{
 assert.match(sql,/audience = 'patient'[\s\S]*visitor_id IS NULL AND session_id IS NULL/);
 assert.match(js,/page_path: audience === 'patient' \? '\/formulario-paciente'/);
});
test('Navegación pública: secciones y botones sin formularios clínicos',()=>{
 assert.match(js,/IntersectionObserver/);
 assert.match(js,/eventType:'section_view'/);
 assert.match(js,/#mainMenu a\[href\^="#"\]/);
 assert.match(js,/if \(!shouldTrackPublicAnalytics\(\)\) return/);
});
