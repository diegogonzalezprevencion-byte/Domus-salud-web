# Domus Salud · Fase 4: métricas públicas históricas

## Antes de instalar

- Respalda el último commit de GitHub y conserva el despliegue anterior de Vercel.
- Trabaja sobre la versión Fase 3; esta entrega contiene el sitio completo, no solo la sección del dashboard.
- Esta versión no cambia LiveKit, las videollamadas, el transcriptor, las actas ni el correo.

## 1. Supabase

SQL Editor → New query → pegar y ejecutar **solo** `supabase/2026-09-21-dashboard-publico-historico.sql`.
No repetir las migraciones anteriores. Esta migración protege la lectura de la tabla `analytics_events`, habilita el evento `section_view` y crea dos funciones RPC de resumen y actividad para administradores verificados mediante Supabase Auth.

Verifica las funciones en SQL Editor:

```sql
SELECT
  to_regprocedure('public.domus_analytics_dashboard(text[])') IS NOT NULL AS resumen,
  to_regprocedure('public.domus_analytics_activity(date,date,integer,integer)') IS NOT NULL AS actividad;
```

Ambas deben indicar `true`. Esto prueba existencia, no prueba todavía el resultado de acceso autenticado.

## 2. GitHub / Vercel

Descomprime el ZIP y sube el contenido a la raíz del repositorio, conservando carpetas `js`, `css` y `supabase`. Espera a que el despliegue de Vercel indique `Ready`.

## 3. Pruebas sin datos sensibles

1. En un navegador de prueba público, entra a la página y elige **Aceptar estadísticas**. Recorre al menos dos secciones y haz clic en un enlace de contacto.
2. Entra a Administrador → Dashboard desde tu cuenta autorizada. Las visitas, clics y secciones deberían incrementar. No te atribuye identidad como paciente.
3. En el filtro de meses, selecciona un mes, luego varios y después todos; comprueba que cambian los recuentos sin limitarse a los últimos 30 días.
4. En Última actividad pública, prueba rango de fechas y botones Anterior/Siguiente.
5. Repite la navegación con **Solo esenciales**: no debe añadir visitas/clics públicos nuevos.
6. Desde un cliente no autenticado, la consulta directa `analytics_events` debe fallar por falta de permisos. El dashboard de un no administrador tampoco debe acceder a las RPC.

## Interpretación y privacidad

- Las cifras son **100 % de los eventos disponibles en Supabase** para cada filtro, no el 100 % del tráfico real: visitas anteriores a la activación, visitantes que rechacen estadísticas, bloqueadores, errores de red y otras limitaciones no pueden recuperarse.
- Se conservan los eventos que ya existen; la migración no borra datos ni impone una ventana de 30 días. Para política de retención de datos, definir tiempos apropiados antes de usar en producción indefinidamente.
- Las visitas son ingresos por sesión; una persona puede generar varias sesiones. "Visitantes aproximados" no identifica personas.
- La analítica de pacientes solo registra aperturas y envíos de formulario como recuentos desprovistos de identidad, no visitas a fichas, datos clínicos ni rutas con tokens.
- El aviso de estadísticas ofrece aceptar/rechazar y el pie de página permite cambiar la preferencia en cualquier momento. Revisar y actualizar el aviso de privacidad de la empresa con asesoría jurídica.
- El código base anterior aún contiene credenciales de ejemplo en JavaScript; verificar y retirar credenciales estáticas / rotar las utilizadas antes de producción. Esta fase no modifica la autenticación existente.
