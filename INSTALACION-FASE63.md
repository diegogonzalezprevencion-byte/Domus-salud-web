# Fase 6.3 — Visita a Paciente

## Cambios
- El menú **Visita a paciente** ofrece únicamente: **Visita Médica**, **Visita Educador**, **Masoterapeuta**.
- **Visita Médica** usa el formulario de **Cuidados Prolongados → Visita Médica**, incluidos los dispositivos invasivos, exclusiones de campos duplicados, selección Nuevo Episodio / Seguimiento y firma por RUT coincidente con el profesional conectado.
- **Visita Educador** y **Masoterapeuta** muestran «Estamos trabajando en este formulario» y no permiten guardar una evolución hasta contar con un formulario definido.
- Los episodios registrados con opciones antiguas siguen disponibles en el historial y pueden descargarse en PDF; no se eliminan datos existentes.
- No hay cambios al esquema de Supabase ni variables de Vercel.

## Instalación
Subir los archivos de este ZIP al repositorio usado por Vercel, manteniendo la estructura de carpetas. El archivo `web.html` referencia `js/app.js` con versión Fase 6.3 para invalidar la caché.

## Pruebas
`npm test` — 109 pruebas aprobadas en entorno de desarrollo.
