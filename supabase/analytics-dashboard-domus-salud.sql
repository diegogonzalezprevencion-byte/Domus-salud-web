-- =====================================================
-- DOMUS SALUD - MÉTRICAS REALES EN SUPABASE
-- Ejecutar en Supabase > SQL Editor > New query > Run
-- Objetivo: registrar visitas, clics y acciones reales de posibles
-- clientes/pacientes, separadas de actividad interna de administradores.
-- =====================================================

begin;

create extension if not exists pgcrypto;

-- =====================================================
-- 1. TABLA DE EVENTOS ANALÍTICOS
-- No almacena RUT, diagnósticos ni información clínica.
-- =====================================================

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  audience text not null default 'public',
  event_type text not null,
  event_label text,
  event_target text,
  section text,
  page_path text,
  referrer text,
  device_type text,
  session_id text,
  visitor_id text,
  admin_user_id text,
  admin_username text,
  professional_id text,
  professional_username text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint analytics_events_audience_check check (
    audience in ('public', 'patient', 'admin', 'professional')
  ),
  constraint analytics_events_event_type_check check (
    event_type in (
      'page_view',
      'click',
      'contact_submit',
      'patient_form_open',
      'patient_form_submit',
      'admin_login',
      'professional_login'
    )
  )
);

-- Columnas preventivas por si la tabla ya existía con menos campos.
alter table public.analytics_events
add column if not exists audience text not null default 'public',
add column if not exists event_type text,
add column if not exists event_label text,
add column if not exists event_target text,
add column if not exists section text,
add column if not exists page_path text,
add column if not exists referrer text,
add column if not exists device_type text,
add column if not exists session_id text,
add column if not exists visitor_id text,
add column if not exists admin_user_id text,
add column if not exists admin_username text,
add column if not exists professional_id text,
add column if not exists professional_username text,
add column if not exists metadata jsonb not null default '{}'::jsonb,
add column if not exists created_at timestamptz not null default now();

-- =====================================================
-- 2. ÍNDICES PARA EL DASHBOARD
-- =====================================================

create index if not exists idx_analytics_events_created_at
on public.analytics_events(created_at desc);

create index if not exists idx_analytics_events_audience_created_at
on public.analytics_events(audience, created_at desc);

create index if not exists idx_analytics_events_event_type_created_at
on public.analytics_events(event_type, created_at desc);

create index if not exists idx_analytics_events_session_id
on public.analytics_events(session_id);

create index if not exists idx_analytics_events_visitor_id
on public.analytics_events(visitor_id);

create index if not exists idx_analytics_events_admin_username
on public.analytics_events(admin_username);

-- =====================================================
-- 3. SEGURIDAD RLS
-- =====================================================

alter table public.analytics_events enable row level security;

drop policy if exists "Analytics events insert" on public.analytics_events;
drop policy if exists "Analytics events read dashboard" on public.analytics_events;
drop policy if exists "Analytics events no update" on public.analytics_events;
drop policy if exists "Analytics events no delete" on public.analytics_events;

-- Permite que la página pública registre eventos con la Publishable Key.
create policy "Analytics events insert"
on public.analytics_events
for insert
to anon, authenticated
with check (
  audience in ('public', 'patient', 'admin', 'professional')
  and event_type in (
    'page_view',
    'click',
    'contact_submit',
    'patient_form_open',
    'patient_form_submit',
    'admin_login',
    'professional_login'
  )
);

-- Permite que el dashboard administrador lea los eventos agregados.
-- La tabla no debe guardar información clínica ni identificadores sensibles.
create policy "Analytics events read dashboard"
on public.analytics_events
for select
to anon, authenticated
using (true);

-- Se bloquean modificaciones y eliminaciones desde la web pública.
create policy "Analytics events no update"
on public.analytics_events
for update
to anon, authenticated
using (false)
with check (false);

create policy "Analytics events no delete"
on public.analytics_events
for delete
to anon, authenticated
using (false);

-- =====================================================
-- 4. PERMISOS
-- =====================================================

grant usage on schema public to anon, authenticated;
grant insert, select on public.analytics_events to anon, authenticated;

commit;
