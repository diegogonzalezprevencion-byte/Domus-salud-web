# Domus Salud - Traspaso automático de antecedentes del paciente

Actualización aplicada al acceso profesional y al formulario previo del paciente.

## Cambios incluidos

- Cuando el paciente completa el formulario previo, sus antecedentes quedan disponibles para la ficha clínica.
- Al abrir un paciente en el panel profesional, la página busca el último formulario previo registrado.
- Los antecedentes se traspasan automáticamente a los formularios del profesional, sin afectar la evolución clínica.
- Se autocompletan campos reutilizables como:
  - diagnóstico principal;
  - motivo de ingreso o visita;
  - edad;
  - alergias y detalle;
  - tabaco, alcohol y drogas;
  - antecedentes generales enviados por el paciente.
- Para procedimientos de enfermería/TENS también se precargan diagnóstico, edad, motivo de visita y alergias.
- Para visita a paciente > nuevo paciente se precargan antecedentes generales y hábitos.
- Para seguimiento se precarga la edad del paciente.

## Supabase

Ejecutar el archivo:

```text
supabase/actualizacion-formulario-previo-paciente.sql
```

Este SQL incluye una función segura por token para que la plataforma pueda leer el formulario previo y traspasarlo al perfil profesional.

## Instalación

1. Subir todo el contenido del ZIP a GitHub.
2. Esperar el redeploy en Vercel.
3. Ejecutar el SQL incluido en Supabase si aún no se ha ejecutado esta versión.
4. Probar el flujo:
   - enviar formulario al paciente;
   - completar antecedentes;
   - ingresar como profesional;
   - seleccionar paciente;
   - abrir formulario de visita o procedimiento.

## Ajuste: aislamiento de antecedentes por paciente

- Al cambiar de paciente en el panel profesional, el formulario clínico se limpia antes de cargar antecedentes.
- Los antecedentes del formulario previo se cargan solo desde la respuesta asociada al paciente seleccionado.
- Si un paciente no tiene formulario previo registrado, no hereda ni muestra información de otro paciente.
- Cuando el campo "Tipo de atención" queda en "Selecciona una atención", no se muestra ningún formato inferior ni signos vitales; los formularios aparecen solo después de seleccionar una atención válida.
