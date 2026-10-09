# Domus Salud · Fase 5 · Reuniones

Esta actualización incorpora:

1. Calendario privado: cada usuario autenticado ve solo reuniones donde participa.
2. Días con reunión destacados en amarillo.
3. Corrección de perfiles duplicados administrador/profesional cuando el duplicado no tiene Auth y coincide con el administrador autenticado.
4. Enlace externo recuperable y visible en el detalle para el organizador.
5. Acta colaborativa dentro de la videollamada: participantes internos e invitados externos pueden redactar y guardar; la aprobación final continúa en Administración.

## Instalación

1. Respaldar el despliegue actual.
2. Ejecutar `supabase/2026-09-23-fase5-reuniones.sql` en Supabase SQL Editor.
3. Subir el contenido completo de este ZIP al repositorio GitHub, reemplazando los archivos existentes.
4. Esperar a que Vercel muestre `Ready`.
5. No es necesario volver a desplegar el agente LiveKit para esta fase.

## Prueba recomendada

- Crear una reunión con dos administradores y comprobar que un tercer administrador no la ve.
- Confirmar que el día aparece amarillo en el calendario de los participantes.
- Verificar que un administrador/profesional duplicado ya no aparezca dos veces.
- Generar un enlace externo, cerrar y volver a abrir el detalle: el enlace debe seguir disponible.
- Entrar a la reunión y usar `Redactar acta` desde dos participantes distintos.
