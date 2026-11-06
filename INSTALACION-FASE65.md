# Fase 6.5 — Portada centrada en los servicios y analítica básica

- Diseño principal aprobado: encabezado Domus Salud, tarjeta principal «CONOCE NUESTROS SERVICIOS» y botón «Ir a la página web».
- Accesos Profesional y Administración en botones secundarios, arriba a la derecha (responsive: accesibles en móvil).
- Se mantienen las rutas /web?acceso=paciente, /web?acceso=profesional y /web?acceso=administracion, además del reenvío directo de enlaces a formularios y reuniones.
- Se eliminó el banner público de consentimiento de estadísticas y el enlace de preferencias del pie. Sin consentimiento explícito no se generan datos detallados de navegación/clics, incluso si existía una preferencia antigua guardada.
- Se mantiene conteo esencial anónimo de visitas y solicitudes, sin identificadores de sesión, RUT, nombre ni datos clínicos. Se conserva el histórico del dashboard.
- No requiere SQL nuevo ni configuración nueva en Vercel.
