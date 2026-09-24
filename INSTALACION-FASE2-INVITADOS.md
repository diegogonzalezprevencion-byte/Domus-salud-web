# Domus Salud · Videollamadas, fase 2 · Acceso externo

Esta actualización parte de **la fase 1 que ya funciona**. No añade IA, API de pago, grabación ni transcripción de invitados. **No ejecutes de nuevo los SQL históricos.**

## Novedades

- El organizador de la reunión puede generar un enlace aleatorio con vencimiento, copiarlo y revocarlo. Solo se conserva su huella SHA-256 en Supabase. Por seguridad, la dirección completa solo se muestra al generarla; si se pierde, revoca y crea otra.
- El invitado entra desde la página pública `/invitado#token=...`, sin cuenta Domus Salud: escribe su nombre y usa cámara, micrófono, desenfoque de fondo (si el navegador lo soporta), selección de audio y visualización de las pantallas compartidas por participantes internos. Puede salir voluntariamente.
- El invitado **no puede consultar** pacientes, fichas, chat guardado, transcripciones, actas ni el calendario. Tampoco puede compartir su propia pantalla ni escribir en el chat en esta fase. La publicación en LiveKit se restringe a cámara y micrófono.
- El enlace permite entrar desde 15 minutos antes del inicio y hasta 15 minutos después del término programado. Revocarlo impide nuevos accesos y el servidor intenta desconectar a todos los invitados del enlace (si no logra confirmar, muestra error para reintentar).
- **Privacidad:** crear un enlace externo desactiva irreversiblemente la transcripción automática para esa reunión, aunque se revoque. No es posible crear un enlace si esa reunión ya activó el agente. Programa otra reunión **interna** si necesitas transcripción con el consentimiento de todos.
- Para reuniones con acceso externo, el administrador puede crear y aprobar un acta **manual sin transcripción**. Debe redactar resumen y acuerdos a partir de sus notas e incorporar manualmente los nombres de invitados externos al documento si corresponde.

## Instalación, en este orden

1. Conserva una copia del commit GitHub y el despliegue actual de Vercel. Confirma que la **fase 1 esté instalada y funcionando** en el mismo proyecto Supabase al que apunta la web.
2. Abre **Supabase → SQL Editor → New query**, pega **solo** `supabase/2026-09-21-fase2-invitados.sql` y presiona **Run**. Debe aparecer `Success`.
3. Verifica instalación desde SQL Editor:

   ```sql
   SELECT
     to_regclass('public.video_guest_links') IS NOT NULL AS enlaces,
     to_regclass('public.video_guest_entries') IS NOT NULL AS ingresos,
     to_regprocedure('public.video_guest_link_create(uuid,uuid,text)') IS NOT NULL AS crear,
     to_regprocedure('public.video_guest_join(text,text,text)') IS NOT NULL AS entrar,
     to_regprocedure('public.video_guest_meeting_enabled(uuid)') IS NOT NULL AS privacidad;
   ```
   Los cinco resultados deben ser `true`. No compartas filas, enlaces ni contraseñas del proyecto.
4. Descomprime `DomusSalud_Fase2.zip` y copia **el contenido interior** a la raíz del repositorio GitHub; deben quedar `index.html`, `invitado.html`, `api/video-guests.js`, `js/video-guest.js`, `js/video-guests-admin.js`, `css/video-guest.css` y demás archivos en sus rutas. No crees una carpeta envolvente dentro del repositorio. No subas archivos `.env` ni claves privadas.
5. En Vercel confirma que **ya existen**, del envío de correos/videollamadas, `PUBLIC_SITE_URL` (por ejemplo `https://tu-dominio.cl`, con dominio público correcto), `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LIVEKIT_URL`, `LIVEKIT_API_KEY` y `LIVEKIT_API_SECRET`. La clave `SUPABASE_SERVICE_ROLE_KEY` permanece **solo en Vercel, nunca en `js/` ni en GitHub**. No se necesitan credenciales nuevas ni OpenAI. Despliega y espera `Ready`.
6. **Prueba con datos ficticios:** programa una reunión nueva, sin iniciar nunca transcripción en ella. En Administrador → Video llamadas → detalle de la reunión, presiona **Generar enlace externo**, confirma el aviso y **Copiar enlace**.
7. Abre el enlace en ventana de incógnito o equipo sin cuenta de Domus, escribe un nombre ficticio. La página mostrará el horario y solo dejará **ingresar durante la ventana autorizada**. Confirma que se conecta a la misma sala que el organizador, que funcionan micrófono/cámara y que ve las pantallas compartidas.
8. En la reunión externa comprueba que **Iniciar transcripción está deshabilitado** y que el acta manual se puede crear y aprobar sin segmentos. Comprueba aparte que la **transcripción normal sigue funcionando en otra reunión interna**, solo con registrados y consentimiento.
9. Revoca el enlace desde el administrador y verifica que desconecta al invitado y bloquea nuevos ingresos. Si la expulsión falla, la pantalla muestra un error; reintenta **Revocar enlace**. No compartas capturas con el enlace completo.

## Límites y seguridad

- Cualquier persona a quien se reenvíe el enlace puede pedir acceso durante su vigencia y usar el nombre que indique. El enlace es una credencial de acceso; compártelo solo con destinatarios autorizados. **No hay verificación de identidad ni sala de espera en esta versión.**
- La revocación impide generar nuevos tokens. Por la naturaleza de los tokens temporales de LiveKit, existe una pequeña ventana de hasta ~30 segundos para un token emitido justo antes de revocar y aún sin usar. Si tienes una sospecha de filtración, cancela la reunión y crea otra; no reutilices el enlace.
- Los invitados no tienen acceso al chat histórico, pero sí pueden ver/escuchar el contenido audiovisual transmitido en la reunión, incluyendo pantallas compartidas. No muestres datos de pacientes o documentos confidenciales a invitados no autorizados. El desenfoque no garantiza ocultación absoluta.
- No se agregan servicios de IA pagados, pero se siguen utilizando los planes actuales de LiveKit, Vercel y Supabase, sujetos a cuotas de uso.
- No se ha ejecutado el SQL ni probado el acceso en tu LiveKit/Vercel reales desde este entorno. Si aparece un error, conserva el mensaje literal sin claves ni enlaces y vuelve al despliegue anterior si fuera necesario.
