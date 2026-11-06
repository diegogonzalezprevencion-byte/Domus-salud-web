# Fase 6.2 — Seguimiento de episodios previos

Se corrige el selector **Seguimiento de Episodio anterior** del perfil profesional. Los registros **Nuevo Episodio** de **Cuidados Prolongados → Visita Médica, Visita TENS y Visita Enfermería** ahora aparecen junto a los de **Visita a paciente** para el mismo paciente.

Se valida que el episodio seleccionado exista, sea inicial y pertenezca al paciente activo, para impedir vinculaciones cruzadas. Los seguimientos conservan su relación con el episodio de origen.

No requiere SQL ni modificaciones en Supabase. Subir el contenido completo del ZIP a la raíz del repositorio y desplegar en Vercel.
