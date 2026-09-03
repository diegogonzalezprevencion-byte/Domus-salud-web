# Domus Salud - Formulario de visitas a paciente

Versión preparada para GitHub y Vercel.

## Cambios incluidos en esta versión

- En **Tipo de atención** ahora quedan las opciones:
  - Procedimientos de enfermería
  - Procedimientos de TENS
  - Visita a paciente
- Al seleccionar **Visita a paciente**, el campo **Procedimiento específico** cambia a **Tipo de visita**.
- Se agregó lista desplegable de tipos de visita:
  - Visita médico general
  - Visita Médico especialista
  - Visita Kine Respiratoria
  - Visita Kine Motora
  - Visita Fonoaudiología
  - Visita Terapia Ocupacional
  - Visita Educación de Salud
  - Visita TENS
  - Visita Enfermería
  - Visita Cuidador
  - Visita de acompañamiento adulto mayor
- El formulario de visitas ahora permite marcar:
  - **Formulario de nuevo paciente**
  - **Formulario de seguimiento de paciente**
- Se incorporó el formato completo de **nuevo paciente**:
  - antecedentes del paciente;
  - hábitos;
  - alergias;
  - antecedentes mórbidos/tratamiento;
  - signos vitales;
  - examen físico segmentario;
  - indicaciones médicas / plan de enfermería;
  - firma profesional.
- Se incorporó el formato completo de **seguimiento de paciente**:
  - antecedentes del paciente;
  - motivo control de rutina / extraordinaria;
  - signos vitales;
  - examen físico segmentario;
  - detalle de la visita;
  - indicaciones médicas / plan de enfermería;
  - firma profesional.
- El PDF imprimible ahora incluye la información específica según el formulario utilizado.
- Se mantienen los formatos anteriores de **procedimiento de enfermería** y **procedimiento de TENS**.
- Se mantiene el envío automático de solicitudes al correo `contacto@domusalud.cl` y el registro en Supabase.

## Supabase

La conexión actual a Supabase está en:

`js/supabase-config.js`

Se agregó una migración opcional en:

`supabase/actualizacion-formulario-visitas.sql`

Ejecuta ese SQL en Supabase solo si quieres reflejar estos nuevos campos y listas dentro de la base de datos. No borra datos existentes.

## Configuración necesaria en Vercel para el envío automático de correos

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

Luego haz **Redeploy** si modificas alguna variable.

## Vercel

- Framework Preset: Other
- Build Command: vacío
- Output Directory: vacío o `.`

## Corrección 2026-09-03 - Formulario de visitas

- Se corrigió la visualización del selector **Tipo de formulario**.
- Al marcar **Nuevo paciente**, solo se muestra el formulario de nuevo ingreso.
- Al marcar **Seguimiento de paciente**, solo se muestra el formulario de seguimiento.
- Se evitó que ambos formularios queden visibles al mismo tiempo por conflicto CSS con el atributo `hidden`.
