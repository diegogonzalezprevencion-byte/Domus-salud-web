-- =====================================================
-- DOMUS SALUD - CENTRALIZACIÓN DE DATOS EN SUPABASE
-- Ejecutar en Supabase > SQL Editor > New query > Run
-- Objetivo: que pacientes, profesionales, evoluciones, testimonios,
-- slides, equipo y métricas ya no dependan de localStorage.
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

-- IMPORTANTE:
-- Esta política permite que la web guarde los datos centralizados usando la publishable key.
-- Es útil para el prototipo actual de Domus Salud porque el login todavía vive en la web.
-- Antes de usar datos reales de pacientes, lo recomendable es migrar el login profesional
-- a Supabase Auth y endurecer estas políticas por rol.

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

-- Registros base. No se sobrescriben si ya existen.
insert into public.domus_app_state (key, payload)
values
  ('domus_admin_users_v1', '[
    {"id":"admin-rmunoz","name":"Reina Muñoz","username":"Rmunoz","password":"Reinamunoz1"},
    {"id":"admin-cmeza","name":"Catalina Meza","username":"Cmeza","password":"Catalinameza1"},
    {"id":"admin-ccontreras","name":"Consuelo Contreras","username":"Ccontreras","password":"Consuelocontreras1"},
    {"id":"admin-dgonzalez","name":"Diego González","username":"Dgonzalez","password":"Diegogonzalez1"}
  ]'::jsonb),
  ('domus_stats_v1', '{"visits":0,"clicks":0,"submissions":0,"clickEvents":[]}'::jsonb),
  ('domus_contact_leads_v1', '[]'::jsonb),
  ('domus_testimonials_v1', '[]'::jsonb),
  ('domus_slide_images_v3', '{}'::jsonb),
  ('domus_team_profiles_v3', '[
    {"id":"reina-munoz","name":"Reina Muñoz Bustos","role":"Enfermera clínica","description":"Cuidado clínico, seguridad de pacientes y mejora continua en la atención domiciliaria.","defaultPhoto":"assets/team/reina-munoz.jpg","alt":"Reina Muñoz Bustos, enfermera clínica de Domus Salud"},
    {"id":"diego-gonzalez","name":"Diego González Lorca","role":"Ing. Prevención de Riesgos y Masoterapeuta Profesional","description":"Gestión preventiva, entornos seguros y apoyo en programas de bienestar domiciliario.","defaultPhoto":"assets/team/diego-gonzalez.jpg","alt":"Diego González Lorca, ingeniero en prevención de riesgos y masoterapeuta profesional de Domus Salud"},
    {"id":"catalina-meza","name":"Catalina Meza Ducaud","role":"Tecnóloga médica","description":"Gestión técnica, coordinación sanitaria y enfoque profesional para servicios de salud.","defaultPhoto":"assets/team/catalina-meza.jpg","alt":"Catalina Meza Ducaud, tecnóloga médica de Domus Salud"},
    {"id":"consuelo-contreras","name":"Consuelo Contreras Rebolledo","role":"Enfermera clínica","description":"Continuidad del cuidado, atención clínica y resguardo de protocolos de seguridad del paciente.","defaultPhoto":"assets/team/consuelo-contreras.jpg","alt":"Consuelo Contreras Rebolledo, enfermera clínica de Domus Salud"}
  ]'::jsonb),
  ('domus_service_professionals_v1', '[
    {"id":"sp-rmunoz","type":"service","firstName":"Reina","lastName":"Muñoz Bustos","rut":"","birthDate":"","profession":"Enfermera clínica","entryDate":"","endDate":"","observations":"Profesional interna de Domus Salud.","username":"Rmunoz","password":"Reinamunoz1","supervisorTeamId":"reina-munoz","teamAccess":["reina-munoz"],"active":true},
    {"id":"sp-cmeza","type":"service","firstName":"Catalina","lastName":"Meza Ducaud","rut":"","birthDate":"","profession":"Tecnóloga médica","entryDate":"","endDate":"","observations":"Profesional interna de Domus Salud.","username":"Cmeza","password":"Catalinameza1","supervisorTeamId":"catalina-meza","teamAccess":["catalina-meza"],"active":true},
    {"id":"sp-ccontreras","type":"service","firstName":"Consuelo","lastName":"Contreras Rebolledo","rut":"","birthDate":"","profession":"Enfermera clínica","entryDate":"","endDate":"","observations":"Profesional interna de Domus Salud.","username":"Ccontreras","password":"Consuelocontreras1","supervisorTeamId":"consuelo-contreras","teamAccess":["consuelo-contreras"],"active":true},
    {"id":"sp-dgonzalez","type":"service","firstName":"Diego","lastName":"González Lorca","rut":"","birthDate":"","profession":"Ing. Prevención de Riesgos y Masoterapeuta Profesional","entryDate":"","endDate":"","observations":"Profesional interno de Domus Salud.","username":"Dgonzalez","password":"Diegogonzalez1","supervisorTeamId":"diego-gonzalez","teamAccess":["diego-gonzalez"],"active":true}
  ]'::jsonb),
  ('domus_patients_v2', '[]'::jsonb),
  ('domus_evolutions_v1', '[]'::jsonb),
  ('domus_patient_intake_template_v1', '{"intro":"Completa todos los campos antes del inicio del servicio para que el equipo de Domus Salud pueda preparar mejor la atención. Si algún dato no aplica, escribe “No aplica”.","questions":[]}'::jsonb),
  ('domus_patient_intake_responses_v1', '[]'::jsonb)
on conflict (key) do nothing;

create index if not exists idx_domus_app_state_updated_at
on public.domus_app_state(updated_at desc);

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.domus_app_state to anon, authenticated;

grant execute on function public.set_updated_at() to anon, authenticated;

commit;
