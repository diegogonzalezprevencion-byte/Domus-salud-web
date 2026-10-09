# Domus Salud · Fase 5.4 — Analítica básica anónima

## Objetivo
- Contar visitas básicas aunque la persona elija "Solo esenciales".
- No enviar `session_id`, `visitor_id`, nombre, RUT, correo ni información clínica en el conteo esencial.
- Mantener secciones y clics sólo para personas que acepten estadísticas.
- Mantener administradores y profesionales verificados fuera de las métricas públicas.
- Incorporar un estado visible de analítica en el Dashboard.

## Instalación
1. Ejecuta `supabase/2026-10-02-fase54-analitica-basica.sql` en Supabase.
2. Sube el contenido completo de esta carpeta a GitHub.
3. Espera que Vercel muestre `Ready`.
4. Prueba la web en incógnito seleccionando primero `Solo esenciales` y luego con otra sesión `Aceptar estadísticas`.

No requiere cambios en LiveKit ni en el agente transcriptor.
