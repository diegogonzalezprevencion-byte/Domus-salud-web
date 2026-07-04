# Domus Salud - Web Home Care

Sitio web estático listo para usar en GitHub y Vercel. No requiere instalación de dependencias ni compilación con npm.

## Estructura

```txt
/
├─ index.html
├─ css/
│  └─ styles.css
├─ js/
│  └─ app.js
├─ vercel.json
├─ robots.txt
└─ README.md
```

## Cómo subir a GitHub

1. Crea un repositorio nuevo en GitHub, por ejemplo `domus-salud-web`.
2. Sube todos los archivos de esta carpeta al repositorio.
3. Verifica que `index.html` quede en la raíz del repositorio.

## Cómo publicar en Vercel

1. Entra a Vercel y selecciona **Add New > Project**.
2. Importa el repositorio desde GitHub.
3. Framework Preset: **Other**.
4. Build Command: dejar vacío.
5. Output Directory: dejar vacío o `.`.
6. Deploy.

## Editar datos de contacto

En `js/app.js` cambia:

```js
const DOMUS_CONFIG = {
  whatsappNumber: '56900000000',
  contactEmail: 'contacto@domus-salud.cl'
};
```

Usa el número de WhatsApp con código país y sin signos. Ejemplo Chile: `56912345678`.

También actualiza los textos visibles en `index.html`:

- Teléfono en enlaces `tel:+56900000000`
- Correo `contacto@domus-salud.cl`
- Nombres o cargos del equipo
- Servicios disponibles

## Notas

- El formulario no guarda datos en una base de datos. Prepara un mensaje y abre WhatsApp.
- Las imágenes se cargan desde Unsplash. Puedes reemplazarlas por imágenes propias en `index.html`.
- El sitio está hecho en HTML, CSS y JavaScript puro para evitar errores de instalación en Vercel.
