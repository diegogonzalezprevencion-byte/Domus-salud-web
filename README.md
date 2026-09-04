# Domus Salud - Formulario paciente corregido envío

Corrección aplicada al formulario previo del paciente:

- El botón **Enviar antecedentes** ahora ejecuta un flujo directo de envío, sin depender solo del submit nativo del navegador.
- Se agregó estado visible **Enviando antecedentes...**.
- Se corrigió la función interna de bloqueo/desbloqueo del botón.
- Si Supabase rechaza el registro, ahora se muestra el detalle real del error.
- Mantiene campos obligatorios y bloqueo de salida hasta completar/enviar el formulario.

Subir todo el contenido del ZIP a GitHub y esperar el redeploy en Vercel.
