-- =====================================================
-- DOMUS SALUD - ANTECEDENTES MÓRBIDOS Y CAMBIOS DE FICHA
-- Ejecutar en Supabase > SQL Editor > New query > Run
-- No elimina administradores ni borra información existente.
-- =====================================================

begin;

create extension if not exists pgcrypto;

-- =====================================================
-- 1. TABLA CENTRAL DE ESTADO DE LA APP
-- La nueva información queda guardada dentro del JSON de pacientes
-- y evoluciones, por lo que no requiere columnas clínicas nuevas.
-- =====================================================

create table if not exists public.domus_app_state (
  key text primary key,
  payload jsonb not null default 'null'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_domus_app_state_updated_at on public.domus_app_state;

create trigger set_domus_app_state_updated_at
before update on public.domus_app_state
for each row
execute function public.set_updated_at();

alter table public.domus_app_state enable row level security;

drop policy if exists "Domus app state read" on public.domus_app_state;
drop policy if exists "Domus app state insert" on public.domus_app_state;
drop policy if exists "Domus app state update" on public.domus_app_state;
drop policy if exists "Domus app state delete" on public.domus_app_state;

create policy "Domus app state read"
on public.domus_app_state
for select
to anon, authenticated
using (
  key in (
    'domus_admin_users_v1',
    'domus_stats_v1',
    'domus_contact_leads_v1',
    'domus_testimonials_v1',
    'domus_slide_images_v3',
    'domus_team_profiles_v3',
    'domus_service_professionals_v1',
    'domus_patients_v2',
    'domus_evolutions_v1',
    'domus_patient_intake_template_v1',
    'domus_patient_intake_responses_v1'
  )
);

create policy "Domus app state insert"
on public.domus_app_state
for insert
to anon, authenticated
with check (
  key in (
    'domus_admin_users_v1',
    'domus_stats_v1',
    'domus_contact_leads_v1',
    'domus_testimonials_v1',
    'domus_slide_images_v3',
    'domus_team_profiles_v3',
    'domus_service_professionals_v1',
    'domus_patients_v2',
    'domus_evolutions_v1',
    'domus_patient_intake_template_v1',
    'domus_patient_intake_responses_v1'
  )
);

create policy "Domus app state update"
on public.domus_app_state
for update
to anon, authenticated
using (
  key in (
    'domus_admin_users_v1',
    'domus_stats_v1',
    'domus_contact_leads_v1',
    'domus_testimonials_v1',
    'domus_slide_images_v3',
    'domus_team_profiles_v3',
    'domus_service_professionals_v1',
    'domus_patients_v2',
    'domus_evolutions_v1',
    'domus_patient_intake_template_v1',
    'domus_patient_intake_responses_v1'
  )
)
with check (
  key in (
    'domus_admin_users_v1',
    'domus_stats_v1',
    'domus_contact_leads_v1',
    'domus_testimonials_v1',
    'domus_slide_images_v3',
    'domus_team_profiles_v3',
    'domus_service_professionals_v1',
    'domus_patients_v2',
    'domus_evolutions_v1',
    'domus_patient_intake_template_v1',
    'domus_patient_intake_responses_v1'
  )
);

create policy "Domus app state delete"
on public.domus_app_state
for delete
to authenticated
using (false);

insert into public.domus_app_state (key, payload)
values
  ('domus_patients_v2', '[]'::jsonb),
  ('domus_evolutions_v1', '[]'::jsonb),
  ('domus_patient_intake_responses_v1', '[]'::jsonb),
  ('domus_patient_intake_template_v1', '{"intro":"Completa todos los campos antes del inicio del servicio para que el equipo de Domus Salud pueda preparar mejor la atención. Si algún dato no aplica, escribe “No aplica”.","questions":[]}'::jsonb)
on conflict (key) do nothing;

create index if not exists idx_domus_app_state_updated_at
on public.domus_app_state(updated_at desc);

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.domus_app_state to anon, authenticated;
grant execute on function public.set_updated_at() to anon, authenticated;

-- =====================================================
-- 2. TABLA DE RESPUESTAS DEL FORMULARIO PREVIO
-- Los nuevos antecedentes mórbidos se guardan dentro de response_data.
-- =====================================================

create table if not exists public.patient_intake_responses (
  id uuid primary key default gen_random_uuid(),
  patient_local_id text not null,
  token text,
  patient_name text,
  patient_rut text,
  response_data jsonb not null default '{}'::jsonb,
  reviewed boolean not null default false,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.patient_intake_responses
add column if not exists patient_local_id text,
add column if not exists token text,
add column if not exists patient_name text,
add column if not exists patient_rut text,
add column if not exists response_data jsonb not null default '{}'::jsonb,
add column if not exists reviewed boolean not null default false,
add column if not exists reviewed_by text,
add column if not exists reviewed_at timestamptz,
add column if not exists created_at timestamptz not null default now(),
add column if not exists updated_at timestamptz not null default now();

alter table public.patient_intake_responses enable row level security;

drop policy if exists "Anyone can submit patient intake response" on public.patient_intake_responses;
drop policy if exists "Admins read patient intake responses" on public.patient_intake_responses;
drop policy if exists "Admins update patient intake responses" on public.patient_intake_responses;
drop policy if exists "Admins delete patient intake responses" on public.patient_intake_responses;

create policy "Anyone can submit patient intake response"
on public.patient_intake_responses
for insert
to anon, authenticated
with check (true);

create policy "Admins read patient intake responses"
on public.patient_intake_responses
for select
to anon, authenticated
using (true);

create policy "Admins update patient intake responses"
on public.patient_intake_responses
for update
to authenticated
using (true)
with check (true);

create policy "Admins delete patient intake responses"
on public.patient_intake_responses
for delete
to authenticated
using (false);

create index if not exists idx_patient_intake_responses_patient_local_id
on public.patient_intake_responses(patient_local_id);

create index if not exists idx_patient_intake_responses_token
on public.patient_intake_responses(token);

create index if not exists idx_patient_intake_responses_created_at
on public.patient_intake_responses(created_at desc);

create index if not exists idx_patient_intake_responses_patient_token_created
on public.patient_intake_responses(patient_local_id, token, created_at desc);

grant select, insert on public.patient_intake_responses to anon, authenticated;
grant update on public.patient_intake_responses to authenticated;

-- =====================================================
-- 3. RPC PARA LEER EL ÚLTIMO FORMULARIO DE UN PACIENTE
-- =====================================================

create or replace function public.get_patient_intake_responses_for_patient(
  patient_local_id_arg text,
  token_arg text
)
returns table (
  id uuid,
  patient_local_id text,
  token text,
  patient_name text,
  patient_rut text,
  response_data jsonb,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    pir.id,
    pir.patient_local_id,
    pir.token,
    pir.patient_name,
    pir.patient_rut,
    pir.response_data,
    pir.created_at
  from public.patient_intake_responses pir
  where pir.patient_local_id = patient_local_id_arg
    and pir.token = token_arg
  order by pir.created_at desc;
$$;

grant execute on function public.get_patient_intake_responses_for_patient(text, text) to anon, authenticated;

commit;
