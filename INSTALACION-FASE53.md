# Domus Salud · Fase 5.3

## Objetivo
Evitar que las identidades `guest:*` creadas por accesos externos aparezcan en **Participantes registrados** al crear o editar una reunión.

## Instalación
1. Ejecuta `supabase/2026-09-24-fase53-roster-interno.sql` en Supabase.
2. Sube el contenido del ZIP a GitHub/Vercel.
3. No actualices LiveKit ni el agente transcriptor.
4. Abre **Nueva reunión** y confirma que Catalina, Consuelo, Reina y Diego aparezcan una sola vez como miembros internos.

Las identidades guest se conservan en Supabase para preservar históricos y no deben borrarse.
