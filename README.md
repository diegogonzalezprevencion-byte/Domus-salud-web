# Domus Salud - Solicitud por correo + WhatsApp flotante

Versión preparada para GitHub y Vercel.

## Cambios incluidos

- Se cambió el correo visible de contacto a `contacto@domusalud.cl`.
- La sección **Solicitud de evaluación** ya no abre WhatsApp al enviar el formulario.
- Al enviar la solicitud:
  - queda registrada en Supabase, si la conexión está activa;
  - se envía automáticamente al correo `contacto@domusalud.cl`, usando la función `/api/send-contact-email`;
  - se muestra confirmación en pantalla.
- Se agregó un botón flotante de WhatsApp visible en toda la página.
- Se optimizó el botón flotante y la sección de contacto para computador y teléfono.
- Se mantiene todo lo anterior: modo administrador, acceso profesional, profesionales, pacientes, fichas clínicas, testimonios, slides y PDF.

## Configuración necesaria en Vercel para el envío automático de correos

Para que el envío automático funcione, agrega estas variables en:

`Vercel → Proyecto Domus Salud → Settings → Environment Variables`

```text
SMTP_HOST=mail.domusalud.cl
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=contacto@domusalud.cl
SMTP_PASS=CLAVE_DEL_CORREO_CONTACTO
CONTACT_TO=contacto@domusalud.cl
CONTACT_FROM=contacto@domusalud.cl
```

Luego haz **Redeploy** del proyecto.

Si DonWeb indica usar puerto 587 en vez de 465, configura:

```text
SMTP_PORT=587
SMTP_SECURE=false
```

## Supabase

La conexión actual a Supabase está en:

`js/supabase-config.js`

No uses ni publiques la Secret key de Supabase.

## Vercel

- Framework Preset: Other
- Build Command: vacío
- Output Directory: vacío o `.`
