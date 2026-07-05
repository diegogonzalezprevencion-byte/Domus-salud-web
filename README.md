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

## Cómo publicar en Vercel

1. Sube todos los archivos a un repositorio de GitHub.
2. En Vercel, importa el repositorio.
3. Usa esta configuración:
   - Framework Preset: `Other`
   - Build Command: vacío
   - Output Directory: vacío o `.`
4. Publica.

## Contacto

Antes de publicar, edita `js/app.js` y reemplaza:

```js
whatsappNumber: '56900000000',
contactEmail: 'contacto@domus-salud.cl'
```

También puedes actualizar el teléfono visible y correo en `index.html`.
