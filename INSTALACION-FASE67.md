# Domus Salud — Fase 6.7

Semáforo de capacidad de medición, en vez de cantidad de eventos registrados.

- Verde: indicadores que siguen recopilando información después de eliminar el aviso de consentimiento.
- Rojo: indicadores de analítica detallada que dejaron de recopilarse, aunque existan valores históricos.
- Los totales históricos se conservan y el filtro por fechas sigue funcionando.
- Los paneles conservan el botón minimizar/expandir.
- No requiere ejecutar migraciones de Supabase.

Esta señal describe la configuración del sitio; no garantiza conectividad en tiempo real con Supabase. La salud de la conexión se muestra en «Estado de analítica».
