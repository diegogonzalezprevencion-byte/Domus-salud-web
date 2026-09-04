-- =====================================================
-- DOMUS SALUD - ACTUALIZACIÓN FORMULARIO DE VISITAS
-- Ejecutar solo si quieres reflejar estos nuevos formatos en Supabase.
-- No borra datos existentes.
-- =====================================================

begin;

-- 1) Tipo general de atención para agrupar visitas
insert into public.care_attention_types (
  id,
  label,
  requires_specific_procedure,
  sort_order,
  active
)
values
  ('visita-paciente', 'Visita a paciente', true, 3, true)
on conflict (id) do update set
  label = excluded.label,
  requires_specific_procedure = excluded.requires_specific_procedure,
  sort_order = excluded.sort_order,
  active = excluded.active,
  updated_at = now();

-- 2) Dejar como inactivos los tipos antiguos de visita, porque ahora se agrupan bajo "Visita a paciente"
update public.care_attention_types
set active = false,
    updated_at = now()
where id in (
  'visita-medico-general',
  'visita-medico-especialista',
  'visita-kinesiologica-respiratoria',
  'visita-kinesiologica-motora',
  'visita-fonoaudiologia',
  'visita-terapia-ocupacional',
  'visita-educacion-salud',
  'visita-estadia-cuidador',
  'visita-estadia-tens',
  'visita-estadia-enfermera',
  'acompanamiento-adulto-mayor'
);

-- 3) Lista de tipos de visita que dependen de "Visita a paciente"
create table if not exists public.patient_visit_types (
  id text primary key,
  label text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.patient_visit_types (id, label, sort_order, active)
values
  ('visita-medico-general', 'Visita médico general', 1, true),
  ('visita-medico-especialista', 'Visita Médico especialista', 2, true),
  ('visita-kine-respiratoria', 'Visita Kine Respiratoria', 3, true),
  ('visita-kine-motora', 'Visita Kine Motora', 4, true),
  ('visita-fonoaudiologia', 'Visita Fonoaudiología', 5, true),
  ('visita-terapia-ocupacional', 'Visita Terapia Ocupacional', 6, true),
  ('visita-educacion-salud', 'Visita Educación de Salud', 7, true),
  ('visita-tens', 'Visita TENS', 8, true),
  ('visita-enfermeria', 'Visita Enfermería', 9, true),
  ('visita-cuidador', 'Visita Cuidador', 10, true),
  ('visita-acompanamiento-adulto-mayor', 'Visita de acompañamiento adulto mayor', 11, true)
on conflict (id) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active,
  updated_at = now();

alter table public.patient_visit_types enable row level security;

drop policy if exists "Anyone can read active patient visit types" on public.patient_visit_types;
drop policy if exists "Admins manage patient visit types" on public.patient_visit_types;

create policy "Anyone can read active patient visit types"
on public.patient_visit_types
for select
to anon, authenticated
using (active = true);

create policy "Admins manage patient visit types"
on public.patient_visit_types
for all
to authenticated
using (public.is_domus_admin())
with check (public.is_domus_admin());

-- 4) Campos estructurados mínimos para visitas. El detalle completo puede guardarse en form_payload JSONB.
alter table public.clinical_evolutions
add column if not exists visit_form_mode text,
add column if not exists visit_type_detail text,
add column if not exists patient_age text,
add column if not exists diagnosis_main text,
add column if not exists admission_reason text,
add column if not exists last_epicrisis text,
add column if not exists physical_exam_summary text,
add column if not exists plan_of_care text,
add column if not exists signature_name text,
add column if not exists signature_rut text,
add column if not exists signature_type text;

create index if not exists idx_patient_visit_types_sort_order
on public.patient_visit_types(sort_order);

create index if not exists idx_clinical_evolutions_visit_form_mode
on public.clinical_evolutions(visit_form_mode);

grant select on public.patient_visit_types to anon, authenticated;
grant all on public.patient_visit_types to authenticated;

commit;
