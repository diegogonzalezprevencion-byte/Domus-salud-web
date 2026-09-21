# ACTUALIZACIÓN VIGENTE · FASE 1 VIDEOLLAMADAS (21-09-2026)

**Comienza por [`INSTALACION-FASE1-VIDEOLLAMADAS.md`](INSTALACION-FASE1-VIDEOLLAMADAS.md).** La migración nueva es `supabase/2026-09-21-fase1-video.sql`. Los apartados siguientes son documentación histórica: los correos del organizador, la transcripción y las actas manuales están disponibles en esta versión; el acceso externo sin cuenta todavía no.

---

# Domus Salud — Envío de invitaciones y web pública

**NUEVA ENTREGA:** consulta primero [`INSTRUCCIONES-INVITACIONES.md`](INSTRUCCIONES-INVITACIONES.md). Incluye la migración incremental `supabase/2026-09-18-invitaciones-email.sql`, la API segura `api/video-invitations.js`, el calendario actualizado y el uso de enlaces públicos de Vercel. No se han enviado correos ni desplegado este ZIP en tu proyecto real desde aquí.

---

# Domus Salud — Video llamadas con chat persistente (18-09-2026)

## Esta es la versión vigente del ZIP

La base es el ZIP **`domus-salud-acceso-unico-administrador-livekit(1).zip`** proporcionado por el usuario. Se conservaron las pantallas de administración, fichas clínicas, agenda, autenticación unificada, generación de tokens de servidor y videollamada existente. Los apartados más abajo son el historial de modificaciones anteriores.

### Qué cambia

- Al ingresar a **Administrador → Video llamadas → Ingresar a la videollamada**, aparece un panel lateral **Chat de la reunión**. Puedes ocultarlo o volver a mostrarlo; en móvil se coloca debajo de los vídeos.
- Los mensajes se guardan mediante `supabase.rpc('video_send_chat', ...)` y se consultan en `video_chat_messages`. El servidor determina el remitente desde Supabase Auth, no desde una identificación introducida en el navegador.
- LiveKit avisa a los participantes de que hay mensajes guardados. Los clientes consultan el texto desde Supabase con su propia sesión y las políticas RLS; un respaldo consulta cada cuatro segundos por si se pierde un aviso LiveKit.
- Se recuperan los últimos 60 mensajes al ingresar y el botón **Cargar mensajes anteriores** permite consultar el historial paginado. Se distinguen autores y horas. Al salir se limpian datos del chat en memoria.
- En caso de fallo de Supabase, el chat muestra el error sin finalizar la videollamada ni declarar falsamente que el mensaje se guardó. Los mensajes se representan como texto, nunca como HTML.

### Instalación / despliegue

1. **Supabase:** el usuario ya ejecutó el SQL del paso 1 que crea `public.video_chat_messages`, habilita RLS y crea la función `public.video_send_chat(uuid, text)`. **No hace falta otro SQL** para esta versión; este ZIP no ejecuta migraciones automáticamente. Si el panel indica que falta `video_chat_messages` o `video_send_chat`, verificar la ejecución del SQL en el mismo proyecto que usa la web.
2. **GitHub:** descomprimir y subir el contenido del ZIP a la raíz del repositorio de Domus Salud, incluyendo el nuevo archivo `js/video-chat.js`, `index.html`, `js/video-call.js`, `js/video-calendar.js` y `css/video-preview.css`.
3. **Vercel:** desplegar el nuevo commit con las mismas cinco variables de entorno ya configuradas: `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`. No agregar claves privadas al frontend.
4. **Prueba:** dos administradores autenticados deben entrar a la **misma reunión**, enviar mensajes y verificar que se muestran en ambos equipos; salir, volver a entrar dentro del horario y comprobar el historial. El botón de chat debe abrirse y cerrarse sin afectar cámara ni micrófono.
5. Si aparece un error, conservar el texto exacto de la alerta del chat. Revisar en Supabase que la función RPC del paso 1 exista, el usuario esté incluido en `video_meeting_participants` y `video_members` esté vinculado a Auth.

**Límites actuales:** no hay transcripción con IA, actas, grabación ni envío automático de correos. El módulo sigue disponible desde el perfil administrador; todavía no existe acceso al calendario/videollamadas para el perfil profesional. Esta entrega no fue conectada a tus servicios remotos desde aquí, por lo que la prueba con dos cuentas en Vercel sigue pendiente. Para datos clínicos reales es necesario revisar los permisos heredados de `domus_app_state` y los accesos antiguos de profesionales antes de su uso.

---

# Historial: Domus Salud — Corrección ficha clínica administrador

Versión corregida para el módulo **Administrador > Pacientes**.

## Cambios incluidos

- Se corrige la visualización de **Fichas clínicas de pacientes**: la sección ya no queda oculta por CSS.
- El botón **Ver ficha clínica** ahora carga la ficha clínica del paciente y desplaza la vista automáticamente hacia la sección correspondiente.
- Se mantiene el panel de filtros por **Tipo de atención** y **Tipo de visita / procedimiento** para revisar el historial de episodios.
- La sección **Formulario previo para pacientes** queda oculta por defecto en una viñeta desplegable con flecha para ver/ocultar.
- Se agrega versionado de archivos CSS/JS para evitar que el navegador siga mostrando una versión en caché.

## Supabase

No requiere ejecutar nuevo SQL si ya se ejecutaron las actualizaciones anteriores de centralización, fichas clínicas y episodios.

## Actualización 2026-09-11 - Edición integrada de ficha clínica

- En Administrador > Pacientes > Ver ficha clínica se eliminó la sección separada “Editar datos generales de ficha clínica”.
- El botón “Editar ficha” quedó junto al título “Ficha clínica · Datos generales del paciente”.
- Al presionarlo, se oculta la vista de solo lectura y se muestran los campos editables de la ficha.
- El botón final ahora indica “Guardar modificaciones”.
- Al guardar, se actualiza la ficha clínica vigente para futuros episodios y se vuelve a mostrar la ficha en formato resumen.
- No requiere cambios adicionales en Supabase.

## Actualización 2026-09-11 - Formulario inicial del paciente

- En Administrador > Pacientes > Ver ficha clínica se eliminó la visualización permanente del bloque “Formulario previo del paciente”.
- Se agregó el botón “Formulario inicial del paciente” junto a “Editar ficha”.
- El botón abre una ventana de consulta con los antecedentes originalmente informados por el paciente.
- Si no existe un formulario registrado, se muestra “Este paciente no registra un formulario inicial.”
- El historial de episodios queda inmediatamente después de los datos generales de la ficha, manteniendo una vista más limpia.

## Actualización 2026-09-11 - Sincronización automática de ficha clínica al guardar episodios

- Al guardar un episodio, los datos del episodio que corresponden a información general vigente del paciente se consolidan automáticamente en la ficha clínica.
- La actualización queda disponible tanto en el perfil **Profesional** como en **Administrador > Pacientes > Ver ficha clínica**.
- Se mantiene la trazabilidad de los campos modificados dentro del episodio.
- Las correcciones realizadas desde **Modificar celdas de ficha** se guardan junto con el episodio y tienen prioridad sobre la información autocompletada.
- El **Formulario inicial del paciente** queda como antecedente histórico: consultarlo ya no puede sobrescribir una ficha clínica que haya sido actualizada posteriormente.
- No requiere cambios adicionales en Supabase.

## Actualización 2026-09-17 — Video llamadas (primera etapa, vista previa)

- Nueva pestaña **Administrador → Video llamadas** con calendario mensual, navegación, selección de fecha, agenda diaria y detalle de reunión.
- **Nueva reunión** abre un panel lateral con título, descripción, fecha, hora, duración y participantes registrados.
- El listado toma administradores y profesionales habilitados desde los perfiles existentes. Si la misma persona tiene ambos perfiles, aparece una vez. La cuenta administradora organizadora se incluye automáticamente.
- El calendario y los detalles pueden probarse en GitHub/Vercel sin cambiar la estructura de Supabase.
- **IMPORTANTE:** las reuniones se almacenan *solo en `sessionStorage` de ese navegador y pestaña*. No son persistentes, multiusuario ni se sincronizan con Supabase. No se envían correos ni se generan enlaces o salas LiveKit. La interfaz muestra expresamente ese estado. Los perfiles existentes no tienen un campo de correo obligatorio: se indica «Correo pendiente de registrar» si corresponde, sin inventar direcciones.
- Próxima etapa: esquema y seguridad de reuniones/participantes en Supabase, campo email validado para cada perfil, endpoint SMTP de invitaciones con manejo de errores y token seguro/servidor LiveKit. Nunca colocar secretos LiveKit o SMTP en JavaScript público.
- Despliegue: reemplazar el contenido del repositorio con los archivos del ZIP y desplegar normalmente en Vercel; no requiere SQL ni variables de entorno nuevas para esta *vista previa*.

## Actualización 2026-09-17 — Supabase para Video llamadas (etapa 2)

**Estado:** implementación de código y migración SQL preparadas. No se ejecutó SQL en el proyecto remoto ni se probaron credenciales reales desde este entorno. Correos y LiveKit todavía no están conectados.

### 1. Aplicar SQL en el proyecto existente

1. Entrar en **Supabase → SQL Editor → New query** del mismo proyecto que figura en `js/supabase-config.js`.
2. Abrir `supabase/2026-09-17-videollamadas.sql`, copiar TODO y pulsar **Run**. No ejecutar los otros SQL históricos de la carpeta; son antecedentes del proyecto.
3. En el SQL Editor, comprobar los integrantes importados (administradores y profesionales, sin copiar contraseñas ni datos de pacientes):

```sql
SELECT id, display_name, email, role, active,
       (auth_user_id IS NOT NULL) AS auth_vinculado
FROM public.video_members
ORDER BY role, display_name;
```

4. Revisar la lista frente a los perfiles existentes. Si un miembro no tiene correo, registrarlo MANUALMENTE y confirmar que le pertenece (es imprescindible para la futura notificación):

```sql
-- Ejemplo: sustituir identificador y correo por datos verificados.
UPDATE public.video_members
SET email = 'correo.real@domusalud.cl', updated_at = now()
WHERE id = 'admin:ID_REAL_DEL_ADMINISTRADOR';
```

Para un profesional la forma del identificador es `professional:ID_REAL_DEL_PROFESIONAL`. El SQL inicial crea un registro por persona y elimina los profesionales duplicados con el mismo nombre de usuario que un administrador. Si se agregan nuevos profesionales posteriormente, habrá que incorporarlos a `video_members` en una fase de sincronización del directorio; por ahora se puede ejecutar nuevamente la migración para importar **nuevas filas**; no actualiza perfiles ya importados.

### 2. Crear usuarios de calendario en Supabase Auth

1. Ir a **Supabase → Authentication → Users → Add user** y crear una cuenta con **correo real verificado y contraseña individual** para cada administrador que programará reuniones. No reutilizar las contraseñas del código antiguo.
2. Con la cuenta ya creada y su correo confirmado, vincularla con el registro correcto en el SQL Editor:

```sql
-- Sustituir por el correo y el ID correctos, confirmados en el SELECT anterior.
UPDATE public.video_members
SET auth_user_id = (
  SELECT id FROM auth.users
  WHERE lower(email) = 'correo.real@domusalud.cl'
    AND email_confirmed_at IS NOT NULL
), updated_at = now()
WHERE id = 'admin:ID_REAL_DEL_ADMINISTRADOR';
```

3. Verificar que `auth_vinculado = true` para ese administrador. Si continúa en `false`, el correo no coincide o la cuenta no está confirmada. No asignar el mismo usuario Auth a dos perfiles; existe una restricción `UNIQUE`.
4. Para futuras funciones de participación individual, crear y vincular también las cuentas Auth de los profesionales (la lista de invitados ya admite profesionales aun sin cuenta Auth). **Los profesionales no pueden crear reuniones desde esta pestaña**, exclusiva del administrador.

### 3. Publicar en GitHub/Vercel

Reemplazar los archivos del repositorio por el contenido de este ZIP, preservando las variables y configuraciones externas que ya existan en Vercel. El frontend usa la URL y la **publishable key** de `js/supabase-config.js`; **no** agregar `service_role` ni claves secretas al JavaScript público. No hacen falta variables LiveKit/SMTP todavía.

Entrar en el administrador de Domus, abrir **Video llamadas**, introducir las credenciales nuevas de **Supabase Auth**, crear una reunión futura y pulsar **Actualizar agenda**. Cerrar sesión, entrar desde otro navegador con el mismo administrador y confirmar que la reunión permanece en la agenda. Si el acceso no está vinculado, la interfaz explica por qué, sin guardar la reunión en una sesión local.

### Datos almacenados y restricciones de seguridad

- `video_members`: directorio de invitados, correo, rol y vínculo opcional con Auth.
- `video_meetings`: título, descripción, organizador, fecha/hora con zona horaria, duración, estado y marcas de tiempo.
- `video_meeting_participants`: participantes e indicadores de correo **NO ENVIADO**.
- `video_email_outbox`: cola privada para la futura integración del proveedor de correo; sus filas quedan `awaiting_email_setup`, sin envío automático.
- La creación de reunión + participantes + cola es **atómica** a través de `video_create_meeting`; las cancelaciones conservan el registro mediante `video_cancel_meeting`.
- RLS habilitado, cero permisos para `anon`, lectura autenticada limitada por pertenencia/rol y escritura solo con funciones que comprueban `auth.uid()`.
- Ni pacientes, ni fichas clínicas, ni contraseñas se copian a estas tablas.

**Aviso crítico sobre el proyecto anterior:** el sistema general aún conserva contraseñas de ejemplo integradas en el código y una tabla `domus_app_state` con permisos amplios, incluso sobre datos clínicos. Estas nuevas tablas están protegidas por separado, pero ello **no vuelve seguro el resto del sistema**. Antes de trabajar con pacientes reales, hay que migrar el login antiguo y la autorización clínica a Supabase Auth/RLS, rotar credenciales expuestas y revisar los accesos. No insertar una clave de servicio en el cliente para eludir los permisos.

**Pendiente, siguiente etapa:** servicio de envío autenticado en Vercel con configuración SMTP o proveedor transaccional y reintentos auditables; creación segura de tokens LiveKit en servidor; enlace individual de acceso; notificaciones de cancelación; registro/sincronización de profesionales de forma segura.


## Actualización LiveKit — 2026-09-17

El módulo ahora incluye `/api/video-token.js` (Vercel) y `js/video-call.js` para iniciar videollamadas dentro del administrador. El backend valida JWT con Supabase Auth, membresía activa e invitación explícita mediante RLS, y permite acceso desde 15 minutos antes hasta 15 minutos después del fin programado. No se requiere SQL adicional. La sala se identifica por UUID y LiveKit la crea cuando entra el primer participante. No se envían correos aún.

### Variables adicionales de Vercel (Settings → Environment Variables)
- `LIVEKIT_URL` (wss://...livekit.cloud)
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET` **solo servidor**
- `SUPABASE_URL` (misma URL pública de `js/supabase-config.js`)
- `SUPABASE_PUBLISHABLE_KEY` (la clave publicable de `js/supabase-config.js`; **NO** service_role)

Se requieren estas dos últimas variables para que la función de servidor valide el JWT y consulte la base con RLS. Instala dependencias mediante el despliegue normal de Vercel y redepliega tras cambiar las variables. No incluyas API secrets en GitHub.

### Prueba
1. Inicia sesión en Domus → Administrador → Video llamadas, con la misma identidad en Supabase Auth.
2. Crea una reunión con otro administrador invitado para los próximos minutos.
3. Desde 15 minutos antes del inicio, abre la reunión y pulsa «Ingresar a la videollamada». Da permisos de cámara/micrófono.
4. Ingresa desde otro navegador con la cuenta de la persona invitada, en un dispositivo distinto de ser posible.
5. Comprueba audio, vídeo, compartir pantalla y salir. Si una cuenta no figura como invitada, no recibe token.

**Alcance:** acceso desde el perfil administrador solamente. Para permitir que profesionales entren desde su propio perfil habrá que construir una vista protegida para profesionales que use su sesión Supabase Auth; esta entrega no finge que dicho acceso esté habilitado. Sin servidor Vercel `/api/video-token` no funcionará (por ejemplo al abrir index.html como archivo local). No hay grabación, transcripción ni correos en esta entrega.


## Corrección 2026-09-18 — Inicio único Administración + Video llamadas

El acceso administrativo deja de aceptar el usuario y la contraseña heredados y ahora solicita **una sola vez** el correo y la contraseña individual de **Supabase Authentication**. Los cuatro administradores ya vinculados en `video_members.auth_user_id` tienen acceso, siempre que su registro esté activo. Tras validar el usuario con `auth.getUser()` y consultar su perfil, se habilita todo el administrador y la agenda aprovecha **esa misma sesión**; no existe un segundo formulario de acceso. En recargas, el sistema restaura la sesión Supabase y vuelve a validar su vínculo. Al cerrar sesión en Administrador, también se cierra Supabase Auth y la videollamada. Un valor anterior en `sessionStorage` no basta para abrir el panel.

**Primer ingreso después de actualizar:** cierra la sesión antigua o refresca el sitio y entra con el **correo y contraseña de Supabase Auth**, no con la clave antigua de Domus. La contraseña debe haberse definido en Authentication → Users / mediante el flujo de invitación o recuperación de contraseña. Vincular `auth_user_id` mediante SQL no crea ni sincroniza contraseñas. No requiere nuevas tablas ni SQL. Se conservan las reuniones de Supabase.

**Seguridad clínica pendiente:** esto unifica el acceso administrativo de la interfaz y la agenda; no corrige por sí solo las políticas permisivas de `domus_app_state`, las claves legadas guardadas en sus registros, ni el inicio de sesión de profesionales. **No utilizar para fichas reales** hasta migrar también el resto del sistema a políticas de acceso seguras y retirar contraseñas antiguas del cliente/base.

---

## NUEVO · Módulo de transcripción (septiembre 2026)

Consultar **`INSTRUCCIONES-TRANSCRIPCION.md`** antes de desplegar. La nueva vista incluye consentimiento individual, consulta de segmentos, inicio/detención protegidos con Supabase Auth y servidor Vercel. Es obligatoria la migración incremental `supabase/2026-09-18-control-transcripcion.sql`. La función `DOMUS_TRANSCRIPTION_ENABLED` permanece desactivada por defecto; el agente de Python actualizado se entrega por separado y no se despliega automáticamente con este sitio.

## Actas estructuradas gratuitas (septiembre 2026)

Consulta `INSTRUCCIONES-ACTAS-GRATUITAS.md`. Ejecuta `supabase/2026-09-18-actas-gratuitas.sql`. Sin API OpenAI, sin funciones de generación IA ni variables de modelo. Plantilla, edición, aprobación, exportación DOCX/impresión PDF y consulta de transcripción existente por Supabase RLS.
