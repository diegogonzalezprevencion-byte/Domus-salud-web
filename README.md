# Domus Salud - Formulario previo para pacientes y acceso profesional full screen

Versión preparada para GitHub y Vercel.

## Cambios incluidos en esta versión

- El modo **Administrador** y el modo **Profesional** ahora se abren al **100% de la pantalla**, no como ventana emergente.
- Se mejoró la visualización responsive para PC/notebook, celular y tablet.
- En **Administrador → Pacientes** se agregó campo de **correo del paciente**.
- En **Administrador → Pacientes** se agregó botón **Enviar formulario al paciente**.
- El formulario previo puede enviarse por:
  - correo del paciente, usando la función de Vercel y las variables SMTP ya configuradas;
  - WhatsApp, usando el teléfono del paciente y un enlace directo al formulario.
- Se agregó un formulario público previo para que el paciente complete antecedentes básicos de salud antes del inicio del servicio.
- La información enviada por el paciente queda asociada a su ficha en **Pacientes registrados → Fichas clínicas por paciente**.
- Se agregó una sección al final de **Administrador → Pacientes** para editar la plantilla del formulario previo.
- Se mantiene todo lo anterior:
  - acceso profesional;
  - fichas clínicas;
  - formulario de procedimientos de enfermería/TENS;
  - formulario de visitas;
  - PDF imprimible;
  - Supabase;
  - envío automático de solicitud de evaluación;
  - WhatsApp flotante.

## Supabase

La conexión actual a Supabase está en:

`js/supabase-config.js`

Para que el formulario previo del paciente funcione entre distintos celulares/computadores, ejecuta esta nueva migración en Supabase:

`supabase/actualizacion-formulario-previo-paciente.sql`

Ruta en Supabase:

`Supabase → SQL Editor → New query → pegar SQL → Run`

Esta migración crea:

- `patient_intake_templates`
- `patient_intake_responses`

No borra datos existentes.

## Configuración necesaria en Vercel para correos

Estas variables deben mantenerse en:

`Vercel → Proyecto Domus Salud → Settings → Environment Variables`

```text
SMTP_HOST=a0041362.ferozo.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=contacto@domusalud.cl
SMTP_PASS=CLAVE_DEL_CORREO_CONTACTO
CONTACT_TO=contacto@domusalud.cl
CONTACT_FROM=contacto@domusalud.cl
```

La nueva función `api/send-patient-intake-email.js` usa las mismas variables SMTP, por lo que no necesitas crear variables nuevas.

Cada vez que modifiques variables en Vercel, haz **Redeploy**.

## Flujo nuevo de paciente

1. El paciente solicita el servicio por WhatsApp o correo.
2. El administrador crea el paciente en **Administrador → Pacientes**.
3. El administrador guarda los datos básicos.
4. Presiona **Enviar formulario al paciente**.
5. El paciente completa el formulario previo.
6. La respuesta queda registrada en Supabase y visible en la ficha del paciente.

## Vercel

- Framework Preset: Other
- Build Command: vacío
- Output Directory: vacío
- Install Command: automático

