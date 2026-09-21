# Domus Salud · Videollamadas, fase 1 · 21-09-2026

Esta actualización parte de **Domus_Salud_Actas_Gratuitas_Web.zip**, que ya contiene chat, transcripción y actas manuales. Conserva las funciones anteriores; no instala ninguna API de IA ni incorpora enlaces de invitados externos.

## Incluye

- Correos de confirmación para el organizador, además de las invitaciones de los participantes. Las reuniones futuras antiguas sin confirmación del organizador se incorporan a la cola **sin enviarse solas**: usar «Reintentar invitaciones pendientes» en su detalle.
- Botón opcional «Difuminar fondo» que intenta procesar la cámara localmente antes de enviarla a LiveKit, mediante la biblioteca `@livekit/track-processors`. Requiere navegador/dispositivo compatible y descargar inicialmente el procesador desde una CDN; si falla, se muestra un aviso y no se anuncia privacidad activada. **Probar antes de utilizarlo en reuniones confidenciales.** No existe garantía absoluta de ocultar objetos/personas.
- Selector de micrófono y salida de audio. El navegador debe admitir `setSinkId` para elegir altavoz; de lo contrario, se desactiva esa opción.
- Presentación en zona principal, cámaras en franja inferior; pantalla completa de la presentación.
- Hasta dos solicitudes de compartir pantalla desde la interfaz Domus, coordinadas con reservas transaccionales de Supabase; los permisos caducan tras 35 segundos sin renovación y se renuevan cada 10 segundos. Con dos pantallas, cada una ocupa una mitad (en móviles, apiladas). **Limitación técnica:** esto regula el cliente oficial; no bloquea una aplicación externa que publique directamente en LiveKit con permisos válidos. Para imponer el límite de forma inviolable a cualquier cliente sería necesaria una capa adicional de control de publicaciones de LiveKit.

## Antes de instalar

1. Guarda una copia o conserva el commit de GitHub y un despliegue anterior de Vercel para poder volver a ellos.
2. Supabase → SQL Editor → New query: ejecutar **solo** `supabase/2026-09-21-fase1-video.sql`, también entregado por separado. No volver a ejecutar los SQL iniciales de videollamadas o actas.
3. Comprobar la instalación con:

```sql
SELECT
  to_regclass('public.video_screen_leases') IS NOT NULL AS tabla_cupos,
  to_regprocedure('public.video_screen_claim(uuid)') IS NOT NULL AS reservar,
  to_regprocedure('public.video_screen_touch(uuid,uuid)') IS NOT NULL AS renovar,
  to_regprocedure('public.video_screen_release(uuid,uuid)') IS NOT NULL AS liberar;
```

Las cuatro columnas deben indicar `true`. El SQL mantiene las tablas de reuniones, transcripciones, actas y pacientes; solo agrega una tabla de reservas, tres RPC y actualiza el RPC de creación de reuniones.

## Publicar

4. Descomprime el ZIP y copia su contenido completo **en la raíz del repositorio**, conservando la carpeta `api`, `js`, `css` y `supabase`. En GitHub, asegúrate de que `api/video-minutes.js` continúe **eliminado**, pues la versión gratuita usa actas manuales vía RPC. No subir `.env`, contraseñas ni service role keys.
5. Confirma que el despliegue de Vercel esté `Ready`. No es necesario instalar OpenAI ni cambiar claves de LiveKit o SMTP que ya funcionan.
6. Haz una prueba sin datos sensibles: programa una nueva reunión contigo mismo y una segunda persona; revisa los dos correos. El estado `sent` significa aceptado por SMTP, no necesariamente entregado a bandeja de entrada.
7. Entra desde dos computadores: prueba dispositivo de entrada/salida, activar/desactivar desenfoque, compartir y ampliar pantalla; agrega un tercer computador e intenta compartir una tercera pantalla para comprobar el rechazo. Detén y vuelve a iniciar la pantalla y confirma que libera el cupo.
8. Verifica que el chat, la transcripción (con consentimiento) y el acta manual siguen disponibles. Si algo falla, restaura el despliegue anterior y conserva el texto del error.

## Estado y etapa pendiente

No se ha ejecutado esta migración en tu Supabase real ni probado en tus navegadores o LiveKit Cloud. Las **invitaciones externas sin cuenta** quedan para la fase 2: requieren enlaces revocables, admisión y adaptación del consentimiento de transcripción; no se deben simular con un UUID público.

Este proyecto reutiliza los servicios actuales sin contratar nuevas APIs de IA, pero los planes gratuitos existentes de LiveKit/Supabase/Vercel siguen sujetos a sus propios límites. Tampoco se han creado avisos de cancelación.
