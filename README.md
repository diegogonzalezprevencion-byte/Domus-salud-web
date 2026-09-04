# Domus Salud - Envío de formulario previo y PDF corporativo

Actualización del flujo de pacientes y ficha clínica.

## Cambios incluidos

- En `Administrador > Pacientes`, el envío del formulario previo al paciente se separó en dos botones pequeños:
  - WhatsApp.
  - Correo.
- Cada botón muestra un ticket/confirmación cuando el formulario fue enviado por ese canal.
- El envío por WhatsApp abre el mensaje con el enlace del formulario.
- El envío por correo usa la función `/api/send-patient-intake-email` y las mismas variables SMTP ya configuradas en Vercel.
- La ficha clínica/PDF del paciente ahora tiene un formato más corporativo:
  - Logo de Domus Salud.
  - Colores institucionales azul y verde.
  - Encabezado más profesional.
  - Secciones con mejor orden visual.
  - Diseño optimizado para imprimir o guardar como PDF.
- Se agregó un flujograma actualizado en:
  - `documentacion/flujo-experiencia-paciente-domus-salud.png`

## Variables Vercel requeridas

Se mantienen las variables ya configuradas:

```text
SMTP_HOST=a0041362.ferozo.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=contacto@domusalud.cl
SMTP_PASS=clave real del correo contacto@domusalud.cl
CONTACT_TO=contacto@domusalud.cl
CONTACT_FROM=contacto@domusalud.cl
```

## Instalación

1. Subir el contenido del ZIP al repositorio GitHub de Domus Salud.
2. Esperar el redeploy automático en Vercel.
3. Probar desde `Administrador > Pacientes`:
   - guardar o seleccionar un paciente;
   - enviar formulario por WhatsApp;
   - enviar formulario por correo;
   - verificar que aparezcan los tickets.
4. Probar `Ver ficha clínica` para revisar el nuevo formato imprimible/PDF.

## Supabase

No requiere una nueva migración obligatoria para este cambio.
