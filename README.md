# Domus Salud Web — formulario paciente obligatorio

Cambios incluidos en esta versión:

- El formulario enviado al paciente deja todos los campos obligatorios.
- Si un dato no aplica, el paciente debe escribir `No aplica`.
- El detalle de alergias solo se exige cuando el paciente marca `Sí`.
- El botón `Volver a la página principal` queda bloqueado mientras el formulario esté incompleto.
- Si el paciente intenta cerrar o salir de la página con datos incompletos, el navegador muestra una advertencia.
- Al enviar correctamente, los campos quedan bloqueados y se habilita la salida.
- El mensaje de error ahora indica si el problema viene de Supabase.

## Importante para solucionar el error de registro

Si al probar aparece: `No pudimos registrar el formulario`, ejecuta el SQL incluido en:

```text
supabase/actualizacion-formulario-previo-paciente.sql
```

Ruta en Supabase:

```text
Supabase → SQL Editor → New query → pegar SQL completo → Run
```

Esto crea o corrige las tablas:

```text
patient_intake_templates
patient_intake_responses
```

y deja activa la política que permite al paciente enviar el formulario desde el enlace público.
