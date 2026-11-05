# Fase 5.9 — Visita médica de Cuidados Prolongados

## Cambios
- Se habilita `Cuidados Prolongados > Visita Médica` usando como base el formulario de visita médica general.
- Se elimina FiO₂ repetido dentro de Respiración para esta variante.
- Se ocultan Sondas y PICC/VVP/Catéter y se reemplazan por Dispositivos Invasivos: tipo, ubicación y observaciones.
- Prótesis dental, Prótesis auricular y Usa lentes pasan al formulario inicial del paciente como casillas múltiples.
- La firma de la visita médica prolongada exige ingresar el RUT y valida que coincida con el profesional autenticado.

## Supabase
No requiere migración SQL. Los nuevos campos se almacenan en las estructuras JSON ya utilizadas por las evoluciones y respuestas del formulario inicial.
