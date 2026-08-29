# Domus Salud - Web con Administrador y Modo Profesional

Proyecto estatico listo para GitHub y Vercel.

## Cambios incluidos

- Fotografias actualizadas del equipo directivo.
- Imagenes actualizadas para los 8 servicios.
- Nueva seccion publica Profesional.
- Nuevo boton superior Acceso profesional.
- Nueva pestana Pacientes dentro del modo administrador.
- Asignacion de pacientes a profesionales.
- Modo profesional con acceso por usuario y clave.
- Registro de evoluciones clinicas por paciente.
- Historial de evoluciones por paciente.
- Descarga/impresion en formato PDF desde el navegador.

## Accesos

Administrador y profesional usan estos accesos iniciales:

- Rmunoz / Reinamunoz1
- Cmeza / Catalinameza1
- Ccontreras / Consuelocontreras1
- Dgonzalez / Diegogonzalez1

## Uso profesional

El administrador debe entrar en Administrador > Pacientes y asignar pacientes al profesional correspondiente. Luego el profesional ingresa por Acceso profesional y vera solo sus pacientes asignados.

## Importante

Esta version funciona sin base de datos y guarda informacion en localStorage del navegador. Para uso real entre distintos computadores, celulares y profesionales, se recomienda conectar la funcionalidad a Supabase u otra base de datos segura.

## Vercel

Framework Preset: Other
Build Command: vacio
Output Directory: .
