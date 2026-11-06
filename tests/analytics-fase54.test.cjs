const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'web.html'), 'utf8');
const sql = fs.readFileSync(path.join(root, 'supabase/2026-10-02-fase54-analitica-basica.sql'), 'utf8');

test('conteo esencial no depende del consentimiento detallado', () => {
  assert.match(app, /function shouldTrackEssentialVisit\(\)/);
  assert.match(app, /eventType:'page_view'[\s\S]*essential:true/);
  assert.match(app, /session_id: audience === 'public' && !essential \? getAnalyticsSessionId\(\) : null/);
});

test('rechazar estadísticas mantiene conteo básico y detiene detalle', () => {
  assert.match(app, /Rechazar estadísticas detiene sólo el seguimiento detallado/);
  assert.match(app, /analyticsSectionObserver\?\.disconnect\(\);[\s\S]*scheduleDomusVisit\(\)/);
});

test('dashboard muestra salud de analítica', () => {
  assert.match(html, /data-analytics-health-status/);
  assert.match(html, /data-analytics-health-last/);
  assert.match(html, /data-analytics-health-24h/);
  assert.match(app, /data-analytics-health-status/);
  assert.match(app, /data-analytics-health-24h/);
});

test('SQL separa visita esencial de navegación detallada', () => {
  assert.match(sql, /event_type IN \('page_view','contact_submit'\)[\s\S]*session_id IS NULL/);
  assert.match(sql, /event_type IN \('section_view','click'\)[\s\S]*session_id IS NOT NULL/);
  assert.match(sql, /'health'/);
  assert.match(sql, /events24h/);
});
