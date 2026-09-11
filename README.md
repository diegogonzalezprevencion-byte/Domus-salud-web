# Domus Salud - Fichas clínicas y episodios

Versión actualizada con mejoras en la relación Administrador / Profesional / Paciente.

## Cambios principales

- La sección Pacientes del administrador funciona como repositorio de fichas clínicas.
- La ficha clínica general se genera con el formulario previo completado por el paciente.
- Los administradores pueden editar los datos generales de la ficha clínica.
- Los profesionales ven la ficha clínica general como antecedente no editable.
- La asignación de pacientes ahora solicita tipo de atención y tipo de visita/procedimiento.
- El perfil profesional muestra primero la ficha clínica general y luego los datos de la visita.
- Fecha y hora de visita quedaron separadas.
- Nuevo paciente cambia a Nuevo Episodio.
- Seguimiento de paciente cambia a Seguimiento de Episodio anterior.
- El Nuevo Episodio genera nombre automático con tipo de atención + tipo de visita + fecha/hora.
- Los seguimientos deben asociarse a un episodio anterior y quedan numerados correlativamente.
- El filtro de Pacientes asignados en perfil profesional tiene mayor contraste visual.

## Supabase

Ejecutar el archivo:

supabase/actualizacion-fichas-clinicas-episodios.sql

Este script no elimina datos ni administradores. Solo asegura permisos y registros base para guardar pacientes, fichas clínicas y episodios en Supabase mediante la tabla central domus_app_state.
