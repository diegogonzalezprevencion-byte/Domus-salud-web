# Domus Salud Web - versión con modo administrador

Proyecto estático listo para subir a GitHub y desplegar en Vercel.

## Despliegue en Vercel

- Framework Preset: `Other`
- Build Command: dejar vacío
- Output Directory: dejar vacío o `.`

## Acceso administrador

El botón **Administrador** aparece en el menú superior.

Usuarios iniciales:

| Usuario | Clave |
|---|---|
| Rmunoz | Reinamunoz1 |
| Cmeza | Catalinameza1 |
| Ccontreras | Consuelocontreras1 |
| Dgonzalez | Diegogonzalez1 |

## Funciones incluidas

- Login privado de administrador.
- Dashboard con ingresos, clics en llamados a la acción y solicitudes enviadas.
- Historial local de solicitudes enviadas por WhatsApp.
- Administración de perfiles de administrador: crear, editar y eliminar.
- Administración de testimonios: crear, editar, aprobar, despublicar y eliminar.
- Sección pública de testimonios aprobados.
- Administración de imágenes de las 8 slides principales: cambiar, eliminar y restaurar.
- Formulario de contacto con región y comuna buscable.
- WhatsApp configurado al número `+56 9 5025 7518`.

## Nota importante

Esta versión funciona sin base de datos y guarda datos en el navegador mediante `localStorage`. Esto permite usarla de inmediato en GitHub/Vercel sin Supabase ni instalación adicional.

Para que las métricas, testimonios, perfiles de administrador e imágenes se sincronicen entre distintos computadores o navegadores, se debe conectar una base de datos externa, por ejemplo Supabase.
