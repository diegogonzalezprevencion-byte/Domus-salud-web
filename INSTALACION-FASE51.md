# Domus Salud · Fase 5.1 · Reuniones editables

Esta versión reemplaza la Fase 5 anterior.

## Cambios
- Se descarta el cambio de calendario privado por participante.
- Se mantiene la vista compartida anterior de Administración.
- Se elimina el resaltado amarillo agregado en la Fase 5.
- Se mantiene la corrección de administradores/profesionales duplicados.
- Se mantiene el enlace externo visible en el detalle de la reunión.
- Se mantiene el acta colaborativa dentro de la videollamada.
- Se agrega el botón **Editar reunión** para la persona organizadora.
- La edición permite cambiar título, descripción, fecha, hora, duración y participantes.
- Al guardar cambios, se vuelven a encolar las invitaciones de los participantes vigentes.
- El mismo enlace externo se conserva y su vigencia se adapta al nuevo horario.

## Instalación
1. Respalda el despliegue actual de Vercel / commit de GitHub.
2. En Supabase SQL Editor ejecuta únicamente:
   `supabase/2026-09-24-fase51-reuniones-editables.sql`
3. Si ya ejecutaste el SQL anterior de Fase 5, este nuevo SQL revierte el cambio de calendario privado.
4. Sube el contenido de este proyecto a GitHub.
5. Espera a que Vercel indique `Ready`.
6. No es necesario volver a desplegar el agente LiveKit.

## Uso
1. Abre Administrador → Video llamadas.
2. Abre una reunión futura organizada por tu usuario.
3. Selecciona **Editar reunión**.
4. Modifica los campos necesarios.
5. Pulsa **Guardar cambios**.
6. Domus reenviará la invitación actualizada a los participantes vigentes.

Solo pueden editarse reuniones futuras y activas, hasta 15 minutos antes del inicio. La edición está reservada a quien organizó la reunión.
