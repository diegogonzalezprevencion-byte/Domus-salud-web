# Domus Salud · Fase 4.1 · Portal corporativo y exclusión de personal

**Orden:** respaldo → SQL nuevo → subir contenidos del ZIP a GitHub → Vercel `Ready` → pruebas. No repetir los SQL anteriores. No se cambia LiveKit.

1. Respaldar el commit de la Fase 4 y conservar el despliegue anterior en Vercel.
2. Ejecutar únicamente `supabase/2026-09-21-fase41-portal-analytics.sql` en Supabase → SQL Editor.
3. Verificar: `SELECT to_regclass('public.domus_analytics_internal_sessions') IS NOT NULL AS sesiones, to_regprocedure('public.domus_analytics_is_internal()') IS NOT NULL AS verificacion, to_regprocedure('public.domus_analytics_register_internal(text)') IS NOT NULL AS registro;` (tres `true`).
4. Subir **el contenido completo** del ZIP a la raíz de GitHub. Importante: ahora la portada es `index.html` y la antigua web es `web.html` (acceso `/web`). Subir ambos sin fusionarlos.
5. Revisar Vercel Deployments → Ready. Abrir el dominio principal, comprobar el logo original, tarjetas Paciente/Profesional/Administración, colores, responsive.
6. Paciente: abrir página pública, aceptar estadísticas; verificar una visita y navegación. Administrador: en otro navegador iniciar sesión por su tarjeta, recorrer web; los eventos internos autenticados deben excluirse. Profesional: abrir su tarjeta; sus visitas desde la ruta interna no se registran como captación.
7. Enlaces antiguos `/?reunion=UUID` y `/?formulario=paciente&...` deben redirigir automáticamente a `/web` conservando los parámetros. Probar solo con datos ficticios. El acceso externo `/invitado` no se altera.

## Interpretación
- La portada no registra visitas ni clics comerciales. El primer evento público sucede en `/web` con consentimiento voluntario.
- En perfiles con Supabase Auth vinculado a `video_members`, una política SQL bloquea nuevos eventos de público/paciente incluso si manipulan el navegador. Para profesionales que utilizan solo el inicio de sesión legado de la app, la separación es a nivel de interfaz y navegador; **no afirmar bloqueo de identidad en servidor**.
- Solo se excluye retrospectivamente una sesión pública cuando un trabajador vinculado la valida iniciando sesión. Los eventos anónimos históricos sin asociación comprobable permanecen; no es posible asignarlos con certeza a personal.
- La estadística refleja eventos efectivamente guardados, no todas las visitas reales. No se almacenan RUT, contenido clínico ni tokens de enlaces en analítica.
- La portada no reemplaza autenticación ni permisos; la protección real de paneles y datos sigue en Supabase/RLS.
- Si un usuario interno utiliza el mismo navegador para navegar como paciente, su marcador persistente evita contabilizar esa actividad; usar otro perfil del navegador para un visitante real.
- Si falla el SQL, **no desplegar la web** hasta resolverlo; SQL en transacción, sin borrar registros.
