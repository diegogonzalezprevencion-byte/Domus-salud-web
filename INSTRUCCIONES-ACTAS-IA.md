# Domus Salud · Actas de reuniones con IA

## Alcance

Se conserva la última versión de videollamadas, calendario, chat, transcripción y correo.
Esta entrega agrega **Administrador → Video llamadas → Ver detalle → Acta de reunión**.

El acta contiene seis secciones: resumen, temas tratados, acuerdos confirmados, compromisos y plazos, pendientes y observaciones. La IA produce **un borrador**, que un administrador invitado puede corregir y aprobar; al aprobar, la edición y regeneración quedan bloqueadas. La acta aprobada se puede bajar en **DOCX nativo** o abrir para **Imprimir → Guardar como PDF** desde el navegador.

## Configuración, en orden

1. En Supabase → SQL Editor, ejecutar completo `supabase/2026-09-18-actas-ia.sql`. No volver a ejecutar los SQL de base de videollamadas. Comprobar:

   ```sql
   SELECT to_regclass('public.video_minutes_consent') IS NOT NULL AS consentimiento_ia,
          to_regclass('public.video_meeting_minutes') IS NOT NULL AS actas;
   ```

   Las dos columnas deben dar `true`. Si PostgREST no detecta las RPC, ejecutar `NOTIFY pgrst, 'reload schema';`.

2. En Vercel → Proyecto Domus Salud → Settings → Environment Variables, configurar en **Production**:

   - `OPENAI_API_KEY`: clave **privada** del servicio OpenAI API, distinta a la suscripción ChatGPT.
   - `OPENAI_MINUTES_MODEL`: opcional. Por defecto `gpt-4o-mini`; si se configura, usar un modelo de Responses API que admita Structured Outputs.
   - Mantener `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` y las variables actuales de LiveKit/SMTP. No enviarlas por chat ni subirlas a GitHub.

   **Atención privacidad**: la transcripción de la reunión se envía a la API de OpenAI *solo tras la acción expresa de generar y una autorización individual adicional de TODOS los invitados*. Antes de usar reuniones reales, revisa las obligaciones contractuales y de protección de datos aplicables a la empresa. Evita material clínico o identificable durante la prueba. `store: false` se envía al proveedor.

3. Subir el contenido de este ZIP al repositorio GitHub que usa Vercel, reemplazando los archivos correspondientes. Ejecutar nuevo despliegue de Production, esperar `Ready`. No es necesario modificar o desplegar de nuevo el agente LiveKit para esta función.

4. Crear una reunión de **prueba sin datos reales** invitando solo a administradores que ya puedan entrar a Domus. Transcribir, **detener** la transcripción y abrir el detalle → `Acta de reunión`. Cada invitado debe entrar con su cuenta y autorizar el uso de la transcripción para un acta IA. Para reuniones con profesionales todavía sin acceso web al calendario, la autorización no puede completarse desde esta interfaz: este piloto se limita a administradores.

5. Cuando todos autoricen, presionar `Generar borrador con IA`. Revisar el resultado contra la transcripción. Editar → `Guardar cambios` → `Aprobar acta`. Solo después aparecen los botones de DOCX y PDF.

## Salvaguardas

- La IA nunca genera actas automáticamente al terminar la llamada, nunca envía actas por correo, no modifica fichas clínicas y no utiliza el chat como fuente.
- El backend valida JWT, rol administrativo, pertenencia a la reunión, consentimientos y transcripción detenida antes de enviar texto a la API. Revalida consentimientos y el estado antes del guardado; la base de datos también revalida dentro de una transacción.
- La revocación impide **nuevas generaciones**. No puede deshacer solicitudes previamente enviadas al proveedor ni borra actas ya aprobadas; gestionar eliminación/retención con una política propia antes de producción.
- El límite de esta versión es 110.000 caracteres de transcripción / 4.500 fragmentos: si se supera, rechaza el proceso íntegro en lugar de resumir una parte sin avisar.
- El documento puede contener errores de transcripción o de IA; debe verificarse y aprobarse por una persona antes de tratarlo como acta formal.
- Los administradores invitados tienen lectura vía RLS; solo ellos pueden editar/aprobar desde funciones autenticadas. Las funciones de almacenamiento automático solo son ejecutables con `service_role` en el servidor.
- Un borrador existente solo se regenera después de una confirmación; la revisión protege cambios concurrentes.

## Nota sobre costes y despliegue

Se necesita una API key válida con facturación habilitada en OpenAI API. Las peticiones consumen el servicio según los precios de ese proveedor. El archivo `vercel.json` fija hasta 60 segundos para la función; si tu plan de Vercel no admite esa duración o el modelo tarda más, habrá que implementar una cola asíncrona.

No se pudieron probar credenciales, modelo remoto, RLS en el proyecto real ni despliegue de producción dentro de este entorno. Las pruebas automatizadas del repositorio y la validez de un DOCX sintético se verificaron localmente.
