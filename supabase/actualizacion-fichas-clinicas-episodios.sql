-- =====================================================
-- DOMUS SALUD - FICHAS CLÍNICAS Y EPISODIOS
-- Ejecutar en Supabase > SQL Editor > New query > Run
-- No elimina información existente ni modifica administradores.
-- Asegura que la versión centralizada pueda guardar pacientes,
-- fichas clínicas generales y episodios/seguimientos en Supabase.
-- =====================================================

begin;

create extension if not exists pgcrypto;

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
  ('domus_service_professionals_v1', '[]'::jsonb)
on conflict (key) do nothing;

create index if not exists idx_domus_app_state_updated_at
on public.domus_app_state(updated_at desc);

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.domus_app_state to anon, authenticated;
grant execute on function public.set_updated_at() to anon, authenticated;

commit;
