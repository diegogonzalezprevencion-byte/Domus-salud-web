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
