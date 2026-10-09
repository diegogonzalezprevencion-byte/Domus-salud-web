# Domus Salud · Fase 5.5 · Fondos virtuales en videollamadas

## Qué incorpora

- Selector **Fondos** dentro de la videollamada de usuarios internos.
- El mismo selector para invitados externos.
- Opción **Original / Sin fondo**.
- Opción **Difuminar**.
- Diez fondos personalizados entregados para Domus Salud.
- Los fondos se procesan localmente en el navegador antes de que la pista sea enviada por LiveKit.
- Las imágenes fueron optimizadas a WebP 1280×720 para reducir carga de red y memoria.

## Instalación

1. Descomprimir el ZIP.
2. Subir/reemplazar el contenido del proyecto en GitHub, conservando la estructura de carpetas.
3. Esperar el despliegue automático de Vercel.
4. Abrir una reunión, activar cámara y presionar **Fondos**.
5. Probar Original, Difuminar y al menos uno de los diez fondos.
6. Hacer la misma prueba desde un enlace de invitado externo.

## Supabase / LiveKit

No hay migración SQL para esta fase.
No hay cambios de configuración en Supabase.
No hay cambios en el agente de transcripción ni en LiveKit Cloud.
No hay nuevas variables de entorno en Vercel.

## Compatibilidad

El efecto depende de las capacidades del navegador para procesamiento de video. Chrome y Edge actualizados son la referencia recomendada. Si un navegador no admite procesamiento de fondos, la videollamada continúa funcionando con la cámara normal.
