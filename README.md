# Domus Salud Web - versión administrador con equipo responsive

Proyecto estático listo para subir a GitHub y desplegar en Vercel.

## Cambios de esta versión

- Se ajustó la sección **Equipo** para que use una sola fuente de datos en todos los tamaños de pantalla.
- Se agregaron parámetros de versión a las fotos del equipo para evitar que celulares o navegadores mantengan imágenes antiguas en caché.
- Se redujo el tamaño visual de las fotografías del equipo en aproximadamente 50% para computador y celular.
- Se redujo el tamaño de vista previa de fotografías dentro del modo administrador.
- Se reemplazaron las fotografías base de:
  - Reina Muñoz Bustos.
  - Catalina Meza Ducaud.
  - Consuelo Contreras Rebolledo.

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
- Administración del equipo directivo: editar descripción, cargo y fotografía de cada integrante.
- Administración de testimonios: crear, editar, aprobar, despublicar y eliminar.
- Sección pública de testimonios aprobados.
- Administración de imágenes de las 8 slides principales: cambiar, eliminar y restaurar.
- Formulario de contacto con región y comuna buscable.
- WhatsApp configurado al número `+56 9 5025 7518`.

## Nota importante

Esta versión funciona sin base de datos y guarda datos en el navegador mediante `localStorage`. Esto permite usarla de inmediato en GitHub/Vercel sin Supabase ni instalación adicional.

Los cambios realizados desde el administrador se verán correctamente en el mismo navegador y en todos los formatos responsive de esa sesión. Para que métricas, testimonios, perfiles de administrador, equipo directivo e imágenes se sincronicen entre distintos computadores, celulares o navegadores, se debe conectar una base de datos externa, por ejemplo Supabase.


## Actualización de fotografías del equipo

Esta versión incorpora las fotografías corregidas de Diego González, Reina Muñoz, Catalina Meza y Consuelo Contreras. También se actualizó el control de versión de imágenes para reducir problemas de caché en computador y celular.
