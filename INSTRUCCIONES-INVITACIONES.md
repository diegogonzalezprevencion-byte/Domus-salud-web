# Domus Salud — reuniones compartidas e invitaciones por correo

Esta entrega se construyó **sobre el ZIP que el usuario comprobó con LiveKit y chat**. No sustituye ni reconstruye los demás módulos. Las reuniones y el chat YA están en Supabase: no hay que migrar los datos desde el navegador. Esta actualización añade el envío real de invitaciones y enlaces HTTPS a la web pública.

## 1. Supabase: ejecutar migración incremental

Proyecto Domus Salud → SQL Editor → New query: ejecutar **únicamente** `supabase/2026-09-18-invitaciones-email.sql`. NO volver a ejecutar el SQL inicial de videollamadas (podría volver a importar datos). Esta migración añade `claimed_at`, permite el estado `sending` y crea `video_claim_pending_invitations(uuid)`, ejecutable solo por `service_role`; no elimina datos ni modifica fichas clínicas.

Verificación:

```sql
SELECT proname FROM pg_proc WHERE proname = 'video_claim_pending_invitations';
SELECT status, count(*) FROM public.video_email_outbox GROUP BY status ORDER BY status;
```

**Correos de invitados:** confirma que cada integrante que vaya a ser invitado tenga un email válido en `video_members`. Ahora el formulario impide crear una reunión con invitados sin email. Los organizadores quedan incluidos automáticamente y no reciben por ahora correo adicional: ellos ya visualizan la reunión en su calendario.

## 2. Publicar sitio (no localhost)

En Vercel, abre el proyecto de Domus Salud → Settings → Domains y comprueba que el dominio público esté asociado a su despliegue Production, con estado válido. Si ya tienes `domusalud.cl` funcionando ahí, **no cambies DNS**. Si todavía no, Vercel indicará qué registros colocar en tu proveedor DNS. También sirve temporalmente la URL HTTPS `*.vercel.app` del despliegue de producción. Usa siempre la dirección pública REAL en `PUBLIC_SITE_URL`, **sin** `/` final ni `localhost`.

El enlace enviado tiene el formato `https://TU-DOMINIO/?reunion=UUID` y muestra el acceso privado a Administrador / Video llamadas. El UUID NO concede acceso: Supabase Auth, los permisos y la invitación siguen siendo obligatorios para entrar a LiveKit.

## 3. Variables en Vercel → Settings → Environment Variables

Mantén las variables existentes `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY`. Añade/confirma estas variables **solo de servidor**:

| Nombre | Valor / origen |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API Keys → clave `service_role` (JWT legacy). **Secreto; solo Vercel, jamás en GitHub o `js/`.** |
| `PUBLIC_SITE_URL` | Dirección HTTPS pública confirmada (ej. `https://domusalud.cl` si Vercel publica ahí). |
| `SMTP_HOST` | Host SMTP real de tu correo corporativo, proporcionado por tu proveedor. |
| `SMTP_PORT` | Normalmente `465` con TLS implícito o `587` con STARTTLS, según el proveedor. |
| `SMTP_SECURE` | `true` para puerto 465, `false` para 587. |
| `SMTP_USER` | Buzón corporativo real que enviará las invitaciones. |
| `SMTP_PASS` | Contraseña de correo SMTP; guardar como secreto. |
| `VIDEO_EMAIL_FROM` | Opcional: misma dirección de `SMTP_USER` o remitente autorizado. Si no existe, se usa `SMTP_USER`. |

Puedes reutilizar las variables SMTP de los formularios anteriores si están correctamente configuradas. No hace falta crear una cuenta de Resend ni trasladar las claves LiveKit. Configura las variables para **Production** y, solo si usarás enlaces de Preview, también Preview con URL pública adecuada. Tras agregar o modificar variables, ejecuta un nuevo despliegue.

**Seguridad:** el `service_role` tiene privilegios elevados. Esta versión lo usa solo en `/api/video-invitations.js` y el servidor comprueba el JWT contra Supabase Auth, que el remitente sea administrador activo y que sea el organizador de la reunión antes de reclamar destinatarios. Nunca compartas esa clave en capturas ni por chat.

## 4. GitHub y Vercel

Descomprime y sube a la raíz del repositorio TODOS los archivos del ZIP, incluyendo la carpeta `api/`, `js/`, `supabase/` y `package.json`. No subas `.env` ni variables secretas; espera a que la publicación de Vercel indique Ready. No ejecutar `index.html` como `file://` ni usar servidor local: la API de correo y la de LiveKit deben ejecutarse en Vercel.

## 5. Probar

1. Abre la URL pública de Domus Salud y entra con tu cuenta administrativa Supabase Auth.
2. En **Administrador → Video llamadas**, programa una reunión futura invitando a otro administrador que tenga email.
3. La reunión se guarda en Supabase; el navegador solicita a Vercel procesar las invitaciones. Se mostrará la diferencia entre guardado y envío, sin anunciar éxito si SMTP falla.
4. Abre el detalle y observa el estado por persona: **Enviado al servidor de correo**, **Error de envío** o **Pendiente**. El botón **Reintentar invitaciones pendientes** aparece únicamente al organizador cuando corresponda y no vuelve a mandar los correos que figuren como enviados.
5. Abre el correo en el otro equipo y verifica que el enlace apunte a tu URL pública y permita abrir la reunión tras iniciar sesión. Prueba desde otra cuenta/PC para confirmar persistencia.

El estado `sent` significa **aceptado por el servidor SMTP**, no garantiza que el correo esté en bandeja de entrada; revisa spam y logs del proveedor si no llega. Si la web no tiene SMTP configurado, la reunión seguirá guardada y podrás reintentar cuando configures las variables.

### Limitaciones expresas

- El acceso a la sala desde el **perfil profesional** todavía no está integrado con Supabase Auth y LiveKit. Los profesionales sí pueden recibir el correo, pero el mensaje advierte que deben coordinar el acceso con el organizador sin compartir claves.
- Todavía **no** se envían mensajes de cancelación; el botón de cancelación lo advierte. Tampoco hay transcripción con IA ni actas automáticas en esta entrega.
- El servidor SMTP puede aceptar un correo y caer antes de registrar su estado en Supabase. Ante fallos de red excepcionalmente podría producirse un reenvío tras 15 minutos; verifícalo en los logs antes de usar **Reintentar** reiteradamente.
- Aún deben revisarse por separado permisos heredados de fichas clínicas y credenciales del perfil profesional antes de operar con datos reales de pacientes. No incluir datos clínicos ni identificadores sensibles en títulos de reuniones.
- No se ha ejecutado el SQL ni comprobado SMTP contra tus cuentas remotas desde aquí: esas pruebas deben realizarse en tu despliegue.
