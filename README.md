# Domus Salud Web — ajustes finales de pacientes y sesiones

Versión actualizada para subir a GitHub/Vercel.

## Cambios incluidos

- El login de Administrador y Profesional ya no queda visible después de iniciar sesión.
- Al iniciar sesión, la vista comienza directamente desde la barra superior de sesión con nombre/apellido y botón **Cerrar sesión**.
- Se mantiene la apertura de Administrador y Profesional a pantalla completa.
- En **Pacientes**, el botón **Ver ficha clínica** abre directamente el historial/PDF del paciente.
- Se mantiene el botón **Enviar formulario al paciente** con color diferenciado.
- Se elimina la edición de texto introductorio y preguntas complementarias del formulario previo.
- El formulario previo queda fijo con:
  1. Identificación del paciente.
  2. Antecedentes básicos de salud.
  3. Hábitos y observaciones.
  4. Confirmación/autorización del paciente.
- Se eliminan las preguntas complementarias del formulario recibido por el paciente.
- Ajustes responsive para escritorio, tablet y celular.

## Despliegue

Subir el contenido del ZIP al repositorio de GitHub conectado a Vercel y esperar el redeploy.

No requiere nuevas variables de entorno ni cambios adicionales en Supabase para estos ajustes.
