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
