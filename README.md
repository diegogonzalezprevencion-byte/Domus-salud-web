# Domus Salud Web - Ajustes profesionales

Versión lista para subir a GitHub y desplegar en Vercel.

## Cambios incluidos

- Eliminada la sección pública "Profesional" de la página principal.
- Se mantiene solo el botón superior "Acceso profesional".
- Fotografías del equipo aumentadas en 25% respecto a la versión anterior.
- Nueva sección en administrador: "Profesionales".
- En "Profesionales" se puede registrar y editar:
  - nombre
  - apellido
  - RUT
  - fecha de nacimiento
  - profesión
  - fecha de ingreso
  - fecha de término opcional
  - observaciones
  - usuario
  - clave
  - estado activo/inactivo
  - equipo Domus con acceso a sus pacientes
- En pacientes, la asignación ahora se realiza al profesional prestador habilitado.
- Los integrantes del equipo Domus vinculados al profesional podrán acceder a los pacientes de ese profesional desde "Acceso profesional".
- Botones de PDF ajustados para abrir una vista previa imprimible en una nueva pestaña, con botón "Imprimir o guardar PDF".

## Despliegue Vercel

Framework Preset: Other
Build Command: vacío
Output Directory: vacío o .

## Nota importante

Esta versión usa localStorage. Los datos se guardan en el navegador donde se administra. Para sincronizar pacientes, profesionales y evoluciones entre varios computadores/celulares, el siguiente paso recomendado es conectar Supabase.
