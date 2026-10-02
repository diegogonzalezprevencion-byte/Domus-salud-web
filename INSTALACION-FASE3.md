# Domus Salud — Fase 3: permisos de reunión para invitados externos

**Estado:** paquete preparado para pruebas; no verificado todavía contra tu Supabase, LiveKit y Vercel en producción. Conserva la Fase 2 publicada como respaldo.

## Cambios

- Todos los participantes, registrados o externos, disponen durante la reunión de cámara, micrófono, desenfoque (si el navegador admite el procesador), configuración de audio (según navegador), chat, pantalla compartida y consentimiento de transcripción. Redacción/aprobación de actas, gestión de enlaces y fichas clínicas siguen restringidas a sus roles autorizados.
- Máximo **dos pantallas compartidas** entre participantes internos y externos, con cupos coordinados en Supabase. No es una prohibición absoluta ante un cliente LiveKit distinto o manipulado; no prometas ese límite fuera de la web Domus Salud.
- El organizador aparece con una única etiqueta de cámara por identidad y pista. En pantalla compartida, las cámaras se muestran en una franja secundaria.
- En iPhone / navegador interno de WhatsApp, «Ampliar vista» evita llamar a `requestFullscreen` cuando no existe. Es una ampliación dentro de la ventana, no pantalla completa nativa.
- Transcripción de invitados externos SOLO con aceptación explícita de todos los participantes. Revocar autorización detiene escrituras en Supabase; revocar enlace bloquea nuevas solicitudes y trata de desconectar invitados activos.

## Instalación, orden IMPORTANTE

1. **Respaldar:** conserva el commit de la Fase 2, despliegue de Vercel y respaldo de Supabase. Idealmente, prueba en un proyecto de staging con datos ficticios. No hagas la actualización durante una reunión activa.
2. **Supabase:** SQL Editor → New query. Ejecuta únicamente `DomusSalud_Fase3.sql` (idéntico al archivo `supabase/2026-09-21-fase3-paridad.sql`). Debe indicar `Success`. NO vuelvas a ejecutar las fases previas ni utilices el SQL de la Fase 2 luego de este.
3. **Agente LiveKit:** en tu PC abre `C:\Users\diego\domus-transcriptor`. Respaldar tu `src\agent.py`. Compara e incorpora el archivo `agent/agent.py` incluido en este ZIP (fuente del agente, NO el HTML). No copies ni subas `.env.local` ni claves privadas a GitHub. Desde la carpeta del agente ejecuta:

   ```powershell
   uv run python -m py_compile .\src\agent.py
   uv run python -c "from livekit import rtc; print(rtc.TrackSource.SOURCE_MICROPHONE)"
   git add src/agent.py
   git commit -m "Compatibilidad invitados transcriptor fase 3"
   lk agent deploy
   lk agent status
   ```

   Espera a `Running`. Si aparece una advertencia de cambios sin confirmar, inspecciona primero `git status --short`; no incluyas secretos. No es necesario actualizar `LIVEKIT_*` ni volver a crear el agente.
4. **Web:** descomprime `DomusSalud_Fase3.zip`; sube el contenido, NO la carpeta contenedora, al repositorio GitHub que utiliza Vercel. El archivo `agent/agent.py` es solo un recurso de instalación; su despliegue se hace por separado. Espera `Ready` en Vercel. No se necesita OpenAI API.
5. **Invitados:** programa una reunión **NUEVA** de prueba; genera enlace; ábrelo en navegador normal o incógnito en un segundo dispositivo. Los antiguos invitados conectados con Fase 2 deben salir y reingresar. Una reunión con enlaces antiguos puede conservar registros que bloqueen la transcripción hasta que todos autoricen; para la prueba usa una reunión nueva.

## Consultas de comprobación (SQL Editor)

```sql
SELECT
  to_regclass('public.video_guest_screen_leases') IS NOT NULL AS cupos_externos,
  to_regprocedure('public.video_guest_join(text,text,text,text)') IS NOT NULL AS ingreso_fase3,
  to_regprocedure('public.video_guest_session(text,text)') IS NOT NULL AS sesion,
  to_regprocedure('public.video_guest_set_consent(text,text,boolean)') IS NOT NULL AS consentimiento,
  to_regprocedure('public.video_guest_send_chat(text,text,text)') IS NOT NULL AS chat,
  to_regprocedure('public.video_guest_screen_claim(text,text)') IS NOT NULL AS compartir;
```

Las seis columnas deben ser `true`. Esto comprueba existencia, NO prueba el funcionamiento en vivo ni las políticas de privacidad.

## Pruebas manuales con datos NO clínicos

1. Interno: comprobar acceso, chat, transcripción y acta manual con reunión solo interna. Confirmar que no regresó un error del transcriptor.
2. Externo: abrir un enlace desde dos navegadores/sesiones; comprobar que Diego aparece una sola vez por participante, y que cada uno ve video y escucha audio.
3. Usar un computador compatible para compartir pantalla primero por un invitado y luego por un interno; confirmar que ambas presentaciones aparecen al 50 %. Un tercero debe recibir aviso de cupos ocupados. Soltar un cupo y probar de nuevo.
4. En iPhone dentro de WhatsApp, comprobar «Ampliar vista»: no debe mostrar `requestFullscreen is not a function`. El navegador puede NO admitir compartir pantalla o elegir altavoces: esto no es un fallo del servidor.
5. Comprobar chat externo ↔ interno. Para transcripción: NO grabar información sensible; todos deben consentir. Si uno no autoriza, debe quedar inactiva. Retirar consentimiento durante captura y comprobar que deja de guardarse texto. Verificar que el agente sigue `Running` y consultar logs si aparece error.
6. Revocar el enlace desde organizador; verificar que no admite nuevos accesos y que los invitados activos fueron desconectados. Si aparece advertencia de expulsión incompleta, insistir/revisar logs.

## Seguridad y costes

- El enlace externo es secreto: compártelo solo con los destinatarios. Cada ingreso genera un secreto de sesión nuevo que solo se guarda como SHA-256 en Supabase.
- No hay servicios de IA nuevos ni API de OpenAI. La transcripción sigue usando LiveKit y está sujeta a cuotas/créditos de tu plan vigente; si deseas gasto cero, conserva la transcripción desactivada en reuniones externas y utiliza acta manual.
- No des acceso a pacientes reales ni uses datos clínicos durante las pruebas. Los invitados NO acceden a fichas, administración ni aprobación de actas.
- El ZIP no contiene claves SMTP, service_role, `.env.local` ni secretos LiveKit.

## Rollback

En caso de error, vuelve al despliegue web anterior y al commit anterior del agente. La migración SQL agrega objetos y sustituye funciones de la transcripción: **volver solo a la web anterior NO restaura automáticamente esas funciones**. Para rollback total prepara copia/funciones originales de Fase 2 o restaura un backup probado. No elimines tablas con reuniones ni transcripciones.
