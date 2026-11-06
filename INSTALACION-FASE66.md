# Fase 6.6 · Teléfono de emergencia y dashboard

- Se incorpora teléfono de emergencia en el registro del administrador y ficha clínica (lectura/edición).
- Los paneles del dashboard se pueden minimizar. Indicador verde = actividad en periodo; rojo = sin actividad registrada en periodo.
- Se registran ingresos profesionales como recuentos sin nombre/RUT. Administradores no se muestran.
- **Se requiere ejecutar el archivo `supabase/FASE66-ACTIVIDAD-PROFESIONAL.sql` desde SQL Editor de Supabase** para habilitar el conteo de ingresos profesionales y mostrarlos con paginación correcta. No altera datos anteriores.
- La nueva estadística no es una prueba de identidad; la autenticación de profesionales del portal sigue siendo gestionada por la aplicación.
