# Domus Salud · Actas estructuradas SIN IA de pago

Esta versión sustituye por completo la anterior propuesta de actas IA. **No utiliza OpenAI API, Ollama ni ningún servicio nuevo de pago.** El reconocimiento de voz de LiveKit ya existente puede seguir sujeto a límites de su plan gratuito; esta entrega no modifica ese consumo.

## Instalación
1. Ejecuta en Supabase SQL Editor **solo** `supabase/2026-09-18-actas-gratuitas.sql` (o el SQL entregado por separado). No ejecutes el archivo anterior de actas IA.
2. Sube el contenido del ZIP al repositorio GitHub de Domus Salud y despliega en Vercel. Conserva variables actuales de Supabase, LiveKit y SMTP. **No agregues OPENAI_API_KEY ni OPENAI_MINUTES_MODEL.**
3. Detén la transcripción y comprueba que haya al menos un fragmento guardado.
4. Administrador → Video llamadas → detalle de reunión → **Acta de reunión** → **Crear plantilla de acta**.
5. Abre «Consultar transcripción original», redacta el resumen, temas, acuerdos, compromisos y pendientes de acuerdo con el registro; guarda, aprueba y descarga Word o imprime/guarda PDF.

## Alcance exacto
- Automático: estructura, vinculación de reunión, participantes, fecha, conteo de segmentos, estados y archivo Word/PDF.
- Manual: interpretación, redacción de resumen, acuerdos, responsables, compromisos y plazos. **No hay resumen IA ni extracción inteligente**; no se inventan decisiones.
- Sólo administradores invitados crean/editan/aprueban; participantes autenticados invitados pueden leer según RLS de Supabase. El texto de la transcripción se lee bajo RLS, en la web, sin remitirse a servidores nuevos.
- Sólo se exporta un acta aprobada. El original transcrito se consulta en el panel, no se incorpora íntegramente a las exportaciones. Se bloquea la creación de plantilla si no hay segmentos o si la transcripción sigue activa.
- La versión anterior del backend `api/video-minutes.js` se elimina del ZIP. Si GitHub ya contiene este archivo, **elimínalo del repositorio** al subir esta versión. El nuevo formulario usa exclusivamente RPC de Supabase con la sesión ya iniciada.
- La seguridad pendiente de las fichas clínicas heredadas de Domus Salud no se modifica aquí; no utilizar datos reales de pacientes hasta revisar sus políticas de acceso.
