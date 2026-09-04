-- =====================================================
-- DOMUS SALUD - FORMULARIO PREVIO PARA PACIENTES
-- Crea plantilla editable y respuestas del paciente para uso desde link público.
-- Ejecutar en Supabase > SQL Editor > Run.
-- =====================================================

begin;

create table if not exists public.patient_intake_templates (
  id text primary key default 'default',
  intro text not null,
  questions jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.patient_intake_templates (id, intro, questions, active)
values (
  'default',
  'Completa esta información antes del inicio del servicio para que el equipo de Domus Salud pueda preparar mejor la atención. Si algún dato no aplica, puedes dejarlo en blanco o escribir “No aplica”.',
  '[
    {"id":"homeRisks","label":"¿Existe algún riesgo relevante en el domicilio que el profesional deba conocer?"},
    {"id":"carePreferences","label":"¿Hay alguna preferencia, rutina u horario importante para la atención?"},
    {"id":"familyConcerns","label":"¿Qué es lo que más preocupa actualmente al paciente o familia?"}
  ]'::jsonb,
  true
)
on conflict (id) do update set
  intro = excluded.intro,
  questions = excluded.questions,
  active = excluded.active,
  updated_at = now();

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

alter table public.patient_intake_templates enable row level security;
alter table public.patient_intake_responses enable row level security;

drop policy if exists "Public read active patient intake template" on public.patient_intake_templates;
drop policy if exists "Admins manage patient intake template" on public.patient_intake_templates;

create policy "Public read active patient intake template"
on public.patient_intake_templates
for select
to anon, authenticated
using (active = true);

create policy "Admins manage patient intake template"
on public.patient_intake_templates
for all
to authenticated
using (public.is_domus_admin())
with check (public.is_domus_admin());

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
to authenticated
using (public.is_domus_admin());

create policy "Admins update patient intake responses"
on public.patient_intake_responses
for update
to authenticated
using (public.is_domus_admin())
with check (public.is_domus_admin());

create policy "Admins delete patient intake responses"
on public.patient_intake_responses
for delete
to authenticated
using (public.is_domus_admin());

create index if not exists idx_patient_intake_responses_patient_local_id
on public.patient_intake_responses(patient_local_id);

create index if not exists idx_patient_intake_responses_created_at
on public.patient_intake_responses(created_at desc);

grant select on public.patient_intake_templates to anon, authenticated;
grant insert on public.patient_intake_responses to anon, authenticated;
grant all on public.patient_intake_templates to authenticated;
grant all on public.patient_intake_responses to authenticated;

commit;
