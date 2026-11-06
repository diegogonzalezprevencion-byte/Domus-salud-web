# Domus Salud · Integración de transcripción (entrega de código)

## Estado de esta entrega

Incluye la interfaz dentro de la videollamada, consentimiento individual, consulta de autorizaciones e historial, función Vercel de despacho/detención, migración SQL incremental y pruebas locales. **Por defecto NO se activa la captura de voz.** El agente de Python se entrega por separado; todavía falta desplegarlo, dotarlo de secretos privados y hacer pruebas reales de consentimiento y audio. No se ha desplegado nada en las cuentas del usuario ni ejecutado SQL en su Supabase.

## 1. Ejecutar SQL incremental (primero)

En Supabase → SQL Editor → New query, ejecutar únicamente:

`supabase/2026-09-18-control-transcripcion.sql`

Requiere que ya se hayan creado `video_transcription_consent` y `video_transcript_segments` mediante el paso anterior. Añade `video_transcription_runs` y cinco funciones. **No volver a ejecutar la migración inicial de videollamadas ni borrar tablas.**

Verificar:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema='public' AND table_name IN
('video_transcription_consent','video_transcript_segments','video_transcription_runs')
ORDER BY table_name;
```

Deben aparecer 3 tablas. Si el SQL muestra error, no activar el agente; copiar el error completo (sin credenciales) para corregirlo.

## 2. Publicar web (sin activar IA aún)

Subir el contenido de este ZIP al repositorio existente y desplegar en Vercel. Preservar variables previas de LiveKit, Supabase y SMTP. El código nuevo usa además `DOMUS_TRANSCRIPTION_ENABLED` como variable **de servidor**. Mantenerla en `false` (o ausente) hasta desplegar y comprobar el agente.

Con la bandera apagada, la agenda, videollamadas, correos y chat siguen disponibles. Dentro de la llamada hay una pestaña «Ver transcripción»: los invitados pueden registrar su autorización y visualizar el historial, pero «Iniciar transcripción» responderá que aún no está habilitada. Este bloqueo es intencional.

**Requisitos existentes en Vercel (privados, no añadir al GitHub):** `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

## 3. Preparar y desplegar el agente (segunda entrega)

Se entrega por separado un ZIP que contiene `src/agent.py`, compatible con la sesión de control. Reemplazar SOLO `src/agent.py` dentro de `C:\Users\diego\domus-transcriptor`; conservar el `pyproject.toml` y el resto de la plantilla. En PowerShell:

```powershell
cd C:\Users\diego\domus-transcriptor
uv run python -m py_compile .\src\agent.py
```

El agente y la web deben apuntar al **mismo** proyecto LiveKit y Supabase. Configurar las cinco credenciales privadas en el entorno seguro del agente, y `DOMUS_TRANSCRIPTION_ENABLED=false` durante la preparación. No pegar secretos en el repositorio, el navegador, capturas ni en este chat. No desplegar/activar en producción sin pruebas de permisos y revocación.

Tras las pruebas controladas, usar `lk agent deploy` desde la carpeta del agente y comprobar que LiveKit Cloud muestra `domus-transcriptor` activo. Activar `DOMUS_TRANSCRIPTION_ENABLED=true` tanto en el agente como en Vercel, y efectuar un despliegue nuevo de Vercel. Un agente desplegado con bandera falsa no entrará en la sala. Es importante confirmar el nombre exacto del agente en LiveKit.

## 4. Prueba funcional controlada, sin pacientes ni información clínica

1. Programar reunión con los cuatro administradores. Cada invitado entra con su sesión Supabase Auth y abre «Ver transcripción» para decidir. Sin los cuatro consentimientos, «Iniciar transcripción» debe permanecer deshabilitado.
2. Un administrador pulsa «Iniciar transcripción»; Vercel usa la RPC segura de Supabase, despacha `domus-transcriptor` y confirma el despacho; la UI indica que fue solicitado, no que ya escuchó.
3. Con micrófonos activos, comprobar que cada intervención FINAL aparezca con nombre y hora aproximada y continúe disponible al volver a abrir la reunión.
4. Retirar un permiso desde uno de los usuarios: la RPC bloquea de inmediato nuevos INSERT, solicita eliminación del despacho y el agente verifica el estado aproximadamente cada segundo. Confirmar en LiveKit Logs que se desconecta y que no se guardan fragmentos posteriores.
5. Probar «Detener transcripción», reconexiones, sesiones caducadas, invitado no autorizado y segundo clic simultáneo en iniciar. Si falla, dejar la bandera apagada.

**Limitaciones conocidas:** la precisión depende del audio y el modelo; se muestran fragmentos finales con hora aproximada de recepción, no subtítulos palabra a palabra. El histórico de la interfaz carga hasta 250 fragmentos iniciales y nuevos segmentos mientras permanece abierta; Supabase conserva los demás según las políticas de retención que deben definirse. Esta entrega no incluye grabación de video/audio, borrador de actas, exportación Word/PDF, purga automática ni acceso desde el perfil profesional heredado. Para conversaciones clínicas es necesaria revisión adicional de privacidad, permisos y retención antes de producción.

## Seguridad del apagado

`video_set_transcription_consent(...,false)` cambia el estado a `stopped` en la misma transacción. La función de Vercel pide a LiveKit eliminar el despacho. El agente consulta el estado y consentimiento de forma periódica y **toda escritura de texto pasa por `video_transcription_write_segment`**, que bloquea la reunión y vuelve a comprobar la autorización en la misma transacción. La parada de audio en red puede demorar brevemente, por lo que hay que ensayar este flujo antes del uso real.
