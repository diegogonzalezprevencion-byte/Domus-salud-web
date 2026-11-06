# Fase 6.4 — Atención Psicológica y asignación múltiple

- Administración y Profesional: se agrega **Atención Psicológica** como nuevo tipo de atención, sin formulario por ahora, con aviso «Estamos trabajando en este formulario». No se permite guardar evoluciones incompletas.
- Administración → Pacientes: casillas de profesionales habilitados, selección individual y casilla «Seleccionar todos». Se exige al menos uno.
- Las fichas antiguas con `professionalId` siguen funcionando. Las nuevas guardan también `professionalIds`, como lista de IDs, en el mismo JSON existente de pacientes.
- Cada profesional asignado puede acceder a la ficha y consultar los episodios previos, iniciar uno nuevo o continuar otro previo usando los formularios ya habilitados. Los episodios siguen siendo del paciente, no exclusivos del creador.
- Los supervisores pueden acceder si supervisan a al menos uno de los profesionales asignados.
- No se necesita migración SQL porque el estado se almacena en JSON en `domus_app_state`.

## Importante
El filtrado de pacientes se hace en la interfaz y no reemplaza políticas de autorización en el servidor. Si se necesita control de acceso clínico robusto frente a peticiones directas a Supabase, se requiere una futura revisión de RLS y de la arquitectura de almacenamiento.
