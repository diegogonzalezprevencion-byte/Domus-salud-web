# Domus Salud — Corrección ficha clínica administrador

Versión corregida para el módulo **Administrador > Pacientes**.

## Cambios incluidos

- Se corrige la visualización de **Fichas clínicas de pacientes**: la sección ya no queda oculta por CSS.
- El botón **Ver ficha clínica** ahora carga la ficha clínica del paciente y desplaza la vista automáticamente hacia la sección correspondiente.
- Se mantiene el panel de filtros por **Tipo de atención** y **Tipo de visita / procedimiento** para revisar el historial de episodios.
- La sección **Formulario previo para pacientes** queda oculta por defecto en una viñeta desplegable con flecha para ver/ocultar.
- Se agrega versionado de archivos CSS/JS para evitar que el navegador siga mostrando una versión en caché.

## Supabase

No requiere ejecutar nuevo SQL si ya se ejecutaron las actualizaciones anteriores de centralización, fichas clínicas y episodios.

## Actualización 2026-09-11 - Edición integrada de ficha clínica

- En Administrador > Pacientes > Ver ficha clínica se eliminó la sección separada “Editar datos generales de ficha clínica”.
- El botón “Editar ficha” quedó junto al título “Ficha clínica · Datos generales del paciente”.
- Al presionarlo, se oculta la vista de solo lectura y se muestran los campos editables de la ficha.
- El botón final ahora indica “Guardar modificaciones”.
- Al guardar, se actualiza la ficha clínica vigente para futuros episodios y se vuelve a mostrar la ficha en formato resumen.
- No requiere cambios adicionales en Supabase.

## Actualización 2026-09-11 - Formulario inicial del paciente

- En Administrador > Pacientes > Ver ficha clínica se eliminó la visualización permanente del bloque “Formulario previo del paciente”.
- Se agregó el botón “Formulario inicial del paciente” junto a “Editar ficha”.
- El botón abre una ventana de consulta con los antecedentes originalmente informados por el paciente.
- Si no existe un formulario registrado, se muestra “Este paciente no registra un formulario inicial.”
- El historial de episodios queda inmediatamente después de los datos generales de la ficha, manteniendo una vista más limpia.

## Actualización 2026-09-11 - Sincronización automática de ficha clínica al guardar episodios

- Al guardar un episodio, los datos del episodio que corresponden a información general vigente del paciente se consolidan automáticamente en la ficha clínica.
- La actualización queda disponible tanto en el perfil **Profesional** como en **Administrador > Pacientes > Ver ficha clínica**.
- Se mantiene la trazabilidad de los campos modificados dentro del episodio.
- Las correcciones realizadas desde **Modificar celdas de ficha** se guardan junto con el episodio y tienen prioridad sobre la información autocompletada.
- El **Formulario inicial del paciente** queda como antecedente histórico: consultarlo ya no puede sobrescribir una ficha clínica que haya sido actualizada posteriormente.
- No requiere cambios adicionales en Supabase.

## Actualización 2026-09-17 — Video llamadas (primera etapa, vista previa)

- Nueva pestaña **Administrador → Video llamadas** con calendario mensual, navegación, selección de fecha, agenda diaria y detalle de reunión.
- **Nueva reunión** abre un panel lateral con título, descripción, fecha, hora, duración y participantes registrados.
- El listado toma administradores y profesionales habilitados desde los perfiles existentes. Si la misma persona tiene ambos perfiles, aparece una vez. La cuenta administradora organizadora se incluye automáticamente.
- El calendario y los detalles pueden probarse en GitHub/Vercel sin cambiar la estructura de Supabase.
- **IMPORTANTE:** las reuniones se almacenan *solo en `sessionStorage` de ese navegador y pestaña*. No son persistentes, multiusuario ni se sincronizan con Supabase. No se envían correos ni se generan enlaces o salas LiveKit. La interfaz muestra expresamente ese estado. Los perfiles existentes no tienen un campo de correo obligatorio: se indica «Correo pendiente de registrar» si corresponde, sin inventar direcciones.
- Próxima etapa: esquema y seguridad de reuniones/participantes en Supabase, campo email validado para cada perfil, endpoint SMTP de invitaciones con manejo de errores y token seguro/servidor LiveKit. Nunca colocar secretos LiveKit o SMTP en JavaScript público.
- Despliegue: reemplazar el contenido del repositorio con los archivos del ZIP y desplegar normalmente en Vercel; no requiere SQL ni variables de entorno nuevas para esta *vista previa*.
