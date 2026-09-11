# Domus Salud — Antecedentes mórbidos, ficha clínica editable y episodios

Versión actualizada con:

- Formulario previo del paciente ampliado con sección **Antecedentes mórbidos / Tratamiento**.
- Ficha clínica general con antecedentes mórbidos detallados.
- Botón en perfil profesional: **Modificar celdas de ficha**.
- Los cambios hechos por el profesional se aplican al guardar el episodio.
- El histórico del episodio registra que hubo modificación de ficha clínica y qué campos cambiaron.
- Se eliminan del formulario de visitas las secciones repetidas de antecedentes del paciente y antecedentes mórbidos/tratamiento.
- Nuevo Episodio y Seguimiento quedan centrados en la atención/evolución, usando la ficha clínica general como antecedente base.

## Supabase

Ejecutar en SQL Editor:

`supabase/actualizacion-morbidos-ficha-profesional.sql`

Este SQL no elimina administradores ni borra información existente.

## Corrección incluida

- La ficha clínica general ahora se mantiene como fuente vigente para futuros episodios.
- El formulario de ingreso del paciente ya no vuelve a sobrescribir una ficha clínica que fue corregida por un profesional o administrador.
- Al guardar una evolución con cambios de ficha, se fuerza la sincronización de pacientes y evoluciones en Supabase antes de mostrar el mensaje de éxito.
- El formulario profesional se vuelve a completar desde la ficha clínica actualizada, no desde el formulario original del paciente.

## SQL

No requiere cambios nuevos en Supabase si ya ejecutaste el SQL anterior de antecedentes mórbidos y episodios.
