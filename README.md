# Domus Salud - Fichas clínicas y acceso profesional

Versión preparada para GitHub y Vercel.

## Cambios incluidos

- Se mantiene el acceso profesional solo desde el botón superior.
- Se eliminó la sección pública de Profesional.
- Se unificaron las pestañas Administradores y Equipo en una sola sección: Administración.
- Se agregó filtro por nombre o RUT en pacientes asignados del panel profesional.
- Se agregó filtro por nombre o RUT en pacientes registrados del administrador.
- Se agregó visualización de ficha clínica por paciente en modo administrador.
- Todos los administradores pueden ver pacientes y evoluciones desde modo administrador.
- En profesionales habilitados, el campo anterior “Equipo Domus con acceso” fue reemplazado por “Administrador supervisor”.
- En el panel profesional se muestra el administrador supervisor asociado.
- Se reorganizó el formulario de evolución en:
  - Datos generales de la visita.
  - Signos vitales del paciente.
  - Formato de atención seleccionada.
- Se actualizó la lista de tipos de atención específica de Domus Salud.
- Para Procedimientos de enfermería y Procedimientos de TENS se abre un campo adicional de procedimiento específico.
- Se ajustaron los botones PDF para abrir una vista imprimible en nueva pestaña.
- Se aumentó el tamaño visual de las fotografías del equipo en un 25% adicional.

## Importante

Esta versión mantiene la lógica operativa actual basada principalmente en localStorage para el panel administrador/profesional, y conserva la conexión Supabase existente para contacto y métricas según la versión anterior. Para uso clínico real entre distintos computadores, se recomienda migrar pacientes, profesionales y evoluciones a Supabase con autenticación completa.

## Vercel

- Framework Preset: Other
- Build Command: vacío
- Output Directory: vacío o `.`
