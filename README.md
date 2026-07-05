# Domus Salud - Web corporativa

Sitio web estático para Domus Salud, listo para GitHub y Vercel.

## Estructura

```text
index.html
css/styles.css
js/app.js
assets/logo-domus-salud.png
assets/logo-domus-header.png
assets/favicon.png
assets/images/servicio-a.jpg
assets/images/servicio-b.jpg
assets/images/servicio-c.jpg
assets/images/servicio-d.jpg
assets/images/servicio-e.jpg
assets/images/servicio-f.jpg
assets/images/servicio-g.jpg
assets/images/servicio-h.jpg
assets/team/reina-munoz.jpg
assets/team/diego-gonzalez.jpg
assets/team/catalina-meza.jpg
assets/team/consuelo-contreras.jpg
vercel.json
robots.txt
```

## Servicios incluidos

- Cuidado de personas mayores
- Atención Clínica especializada
- Asistencia para discapacidades
- Kinesiología y Masoterapia
- Integración y Vida Social
- Curaciones simples y avanzadas
- Servicios de Salud Mental
- Otros servicios: Fonoaudiología, nutrición y dietética, vacunación


## Equipo directivo incluido

- Reina Muñoz Bustos — Enfermera clínica
- Diego González Lorca — Ing. Prevención de Riesgos y Masoterapeuta Profesional
- Catalina Meza Ducaud — Tecnóloga médica
- Consuelo Contreras Rebolledo — Enfermera clínica

## Cómo publicar en Vercel

1. Sube todos los archivos a un repositorio de GitHub.
2. En Vercel, importa el repositorio.
3. Usa esta configuración:
   - Framework Preset: `Other`
   - Build Command: vacío
   - Output Directory: vacío o `.`
4. Publica.

## Contacto

El WhatsApp configurado para el formulario es:

```js
whatsappNumber: '56950257518'
```

El número de WhatsApp configurado para recibir solicitudes es `+56 9 5025 7518`. El teléfono no queda visible en la sección de contacto ni en el pie de página; solo se usa para enviar el formulario por WhatsApp. También puedes actualizar el correo en `js/app.js` y en `index.html`.


## Actualización de orden
- Menú superior ajustado a: Quiénes somos, Servicios, Equipo y Solicitar evaluación.
- Sección Quiénes somos ubicada inmediatamente después del slider principal.
- Sección Servicios ubicada después de Quiénes somos.
- Se eliminó el botón superior independiente de Contacto, manteniendo solo “Solicitar evaluación”.

## Última actualización
- Se agregaron campos de Región y Comuna en el formulario de contacto.
- Las regiones y comunas funcionan como listas desplegables con buscador.
- La comuna se habilita según la región seleccionada.
- El mensaje enviado por WhatsApp ahora incluye región y comuna.


## Ajustes de esta versión

- Imagen de Kinesiología y Masoterapia actualizada.
- Número visible eliminado de la sección de contacto y del pie de página.
- Logo Homecare incorporado en el footer.
