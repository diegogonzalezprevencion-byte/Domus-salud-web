-- DOMUS SALUD | Calendario de videollamadas | Etapa 1: Supabase
-- Ejecutar UNA VEZ (se puede reejecutar para crear objetos faltantes) en SQL Editor.
-- No altera las tablas clinicas existentes ni habilita LiveKit/SMTP.
-- Requiere Supabase Auth para programar reuniones. No usa claves antiguas de la web.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Directorio de invitados. id coincide con los ids que usa la web existente.
-- auth_user_id se enlaza MANUALMENTE, por email verificado, desde el SQL Editor.
CREATE TABLE IF NOT EXISTS public.video_members (
  id text PRIMARY KEY,
  auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name text NOT NULL CHECK (length(btrim(display_name)) BETWEEN 1 AND 160),
  email text,
  role text NOT NULL CHECK (role IN ('admin', 'professional')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT video_members_email_format CHECK (
    email IS NULL OR (email = lower(btrim(email)) AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
  )
);

CREATE TABLE IF NOT EXISTS public.video_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id text NOT NULL REFERENCES public.video_members(id) ON DELETE RESTRICT,
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 120),
  description text NOT NULL DEFAULT '' CHECK (length(description) <= 1500),
  starts_at timestamptz NOT NULL,
  timezone text NOT NULL DEFAULT 'America/Santiago',
  duration_minutes integer NOT NULL CHECK (duration_minutes IN (15, 30, 45, 60, 90, 120)),
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  cancelled_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.video_meeting_participants (
  meeting_id uuid NOT NULL REFERENCES public.video_meetings(id) ON DELETE CASCADE,
  member_id text NOT NULL REFERENCES public.video_members(id) ON DELETE RESTRICT,
  participation_status text NOT NULL DEFAULT 'invited'
    CHECK (participation_status IN ('organizer', 'invited', 'accepted', 'declined')),
  email_status text NOT NULL DEFAULT 'not_configured'
    CHECK (email_status IN ('not_applicable', 'missing_email', 'not_configured', 'pending', 'sent', 'failed')),
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (meeting_id, member_id)
);

-- Buzon privado: NO envia correos. Un proceso de servidor se integrara despues.
CREATE TABLE IF NOT EXISTS public.video_email_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES public.video_meetings(id) ON DELETE CASCADE,
  member_id text NOT NULL REFERENCES public.video_members(id) ON DELETE RESTRICT,
  recipient_email text NOT NULL,
  event_type text NOT NULL DEFAULT 'invitation' CHECK (event_type IN ('invitation', 'cancellation')),
  status text NOT NULL DEFAULT 'awaiting_email_setup'
    CHECK (status IN ('awaiting_email_setup', 'pending', 'sent', 'failed')),
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  UNIQUE (meeting_id, member_id, event_type)
);

CREATE INDEX IF NOT EXISTS video_meetings_starts_idx ON public.video_meetings(starts_at);
CREATE INDEX IF NOT EXISTS video_participants_member_idx ON public.video_meeting_participants(member_id);
CREATE INDEX IF NOT EXISTS video_members_auth_idx ON public.video_members(auth_user_id);
CREATE INDEX IF NOT EXISTS video_outbox_status_idx ON public.video_email_outbox(status, created_at);

-- Importacion INICIAL de nombres y perfiles desde la app actual (sin contrasenas, RUT ni datos clinicos).
-- Si se reejecuta, no sobreescribe correos, asociaciones Auth ni cambios manuales.
INSERT INTO public.video_members (id, display_name, email, role, active)
SELECT 'admin:' || (p.value ->> 'id'),
       left(coalesce(nullif(btrim(p.value ->> 'name'), ''), nullif(btrim(p.value ->> 'username'), ''), 'Administrador'),160),
       CASE WHEN lower(btrim(coalesce(p.value ->> 'email', ''))) ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
            THEN lower(btrim(p.value ->> 'email')) ELSE NULL END,
       'admin', true
FROM public.domus_app_state s
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(s.payload)='array' THEN s.payload ELSE '[]'::jsonb END
) AS p(value)
WHERE s.key='domus_admin_users_v1' AND nullif(p.value ->> 'id','') IS NOT NULL
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.video_members (id, display_name, email, role, active)
SELECT 'professional:' || (p.value ->> 'id'),
       left(coalesce(nullif(btrim(concat_ws(' ',p.value->>'firstName',p.value->>'lastName')), ''),
                     nullif(btrim(p.value->>'name'), ''), 'Profesional'),160),
       CASE WHEN lower(btrim(coalesce(p.value->>'email',''))) ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
            THEN lower(btrim(p.value->>'email')) ELSE NULL END,
       'professional', coalesce((p.value ->> 'active')::boolean, true)
FROM public.domus_app_state s
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(s.payload)='array' THEN s.payload ELSE '[]'::jsonb END
) AS p(value)
WHERE s.key='domus_service_professionals_v1'
  AND nullif(p.value->>'id','') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.domus_app_state a
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(a.payload)='array' THEN a.payload ELSE '[]'::jsonb END
    ) AS adm(value)
    WHERE a.key='domus_admin_users_v1'
      AND nullif(btrim(adm.value->>'username'),'') IS NOT NULL
      AND lower(btrim(adm.value->>'username'))=lower(btrim(p.value->>'username'))
  )
ON CONFLICT (id) DO NOTHING;

-- Evitar filtraciones: sin acceso anonimo, sin escrituras directas desde el navegador.
ALTER TABLE public.video_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_email_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.video_members, public.video_meetings,
  public.video_meeting_participants, public.video_email_outbox FROM anon, authenticated;
GRANT SELECT ON TABLE public.video_members, public.video_meetings,
  public.video_meeting_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.video_email_outbox TO service_role;

-- Helpers SECURITY DEFINER: leen solo pertenencia/participacion; no exponen filas completas.
-- Cada funcion usa auth.uid() real, no un id aportado por el cliente.
CREATE OR REPLACE FUNCTION public.video_is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.video_members m
    WHERE m.auth_user_id = (SELECT auth.uid())
      AND m.active AND m.role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.video_can_read_meeting(p_meeting_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.video_members m
    WHERE m.auth_user_id = (SELECT auth.uid()) AND m.active
      AND (m.role = 'admin' OR EXISTS (
        SELECT 1 FROM public.video_meeting_participants p
        WHERE p.meeting_id = p_meeting_id AND p.member_id = m.id
      ))
  );
$$;

REVOKE ALL ON FUNCTION public.video_is_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.video_can_read_meeting(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.video_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.video_can_read_meeting(uuid) TO authenticated;

DROP POLICY IF EXISTS video_members_read ON public.video_members;
CREATE POLICY video_members_read ON public.video_members FOR SELECT TO authenticated
USING (auth_user_id = (SELECT auth.uid()) OR ((SELECT public.video_is_admin()) AND active));

DROP POLICY IF EXISTS video_meetings_read ON public.video_meetings;
CREATE POLICY video_meetings_read ON public.video_meetings FOR SELECT TO authenticated
USING ((SELECT public.video_is_admin()) OR public.video_can_read_meeting(id));

DROP POLICY IF EXISTS video_participants_read ON public.video_meeting_participants;
CREATE POLICY video_participants_read ON public.video_meeting_participants FOR SELECT TO authenticated
USING (public.video_can_read_meeting(meeting_id));

-- Escritura atomica: la reunion y sus participantes se guardan en una sola transaccion.
-- Ni el frontend ni el RPC pueden atribuir la organizacion a otro usuario.
CREATE OR REPLACE FUNCTION public.video_create_meeting(
  p_title text,
  p_description text,
  p_starts_at timestamptz,
  p_duration_minutes integer,
  p_participant_ids text[],
  p_timezone text DEFAULT 'America/Santiago'
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_organizer text;
  v_meeting uuid;
  v_participants text[] := coalesce(p_participant_ids, ARRAY[]::text[]);
BEGIN
  SELECT m.id INTO v_organizer FROM public.video_members m
  WHERE m.auth_user_id=(SELECT auth.uid()) AND m.active AND m.role='admin';
  IF v_organizer IS NULL THEN
    RAISE EXCEPTION 'Acceso denegado: vincula tu cuenta de Supabase Auth a un administrador activo.' USING ERRCODE='42501';
  END IF;
  IF p_title IS NULL OR length(btrim(p_title)) NOT BETWEEN 1 AND 120
     OR length(coalesce(p_description,'')) > 1500
     OR p_starts_at IS NULL OR p_starts_at < now()
     OR p_duration_minutes NOT IN (15,30,45,60,90,120)
     OR p_timezone IS NULL
     OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_timezone_names z WHERE z.name=p_timezone) THEN
    RAISE EXCEPTION 'Datos invalidos: revisa titulo, fecha futura, hora, duracion y zona horaria.' USING ERRCODE='22023';
  END IF;
  IF cardinality(v_participants)>100 OR EXISTS (
    SELECT 1 FROM unnest(v_participants) AS requested(id)
    LEFT JOIN public.video_members m ON m.id=requested.id AND m.active
    WHERE m.id IS NULL
  ) THEN
    RAISE EXCEPTION 'La lista contiene participantes inexistentes/inactivos o supera el limite de 100.' USING ERRCODE='22023';
  END IF;

  INSERT INTO public.video_meetings (organizer_id,title,description,starts_at,timezone,duration_minutes)
  VALUES (v_organizer,btrim(p_title),coalesce(btrim(p_description),''),p_starts_at,p_timezone,p_duration_minutes)
  RETURNING id INTO v_meeting;

  INSERT INTO public.video_meeting_participants(meeting_id,member_id,participation_status,email_status)
  SELECT v_meeting,m.id,
         CASE WHEN m.id=v_organizer THEN 'organizer' ELSE 'invited' END,
         CASE WHEN m.id=v_organizer THEN 'not_applicable'
              WHEN m.email IS NULL THEN 'missing_email' ELSE 'not_configured' END
  FROM public.video_members m
  WHERE m.id=v_organizer OR m.id=ANY(v_participants);

  INSERT INTO public.video_email_outbox (meeting_id,member_id,recipient_email)
  SELECT v_meeting,m.id,m.email
  FROM public.video_members m
  WHERE m.id<>v_organizer AND m.id=ANY(v_participants) AND m.email IS NOT NULL;

  RETURN v_meeting;
END;
$$;

-- Cancelacion logica; no elimina el historial. El correo de cancelacion se integrara despues.
CREATE OR REPLACE FUNCTION public.video_cancel_meeting(p_meeting_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_organizer text;
BEGIN
  SELECT m.id INTO v_organizer FROM public.video_members m
  WHERE m.auth_user_id=(SELECT auth.uid()) AND m.active AND m.role='admin';
  IF v_organizer IS NULL THEN
    RAISE EXCEPTION 'Acceso denegado.' USING ERRCODE='42501';
  END IF;
  UPDATE public.video_meetings SET status='cancelled',cancelled_at=now(),updated_at=now()
  WHERE id=p_meeting_id AND organizer_id=v_organizer AND status='scheduled';
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.video_create_meeting(text,text,timestamptz,integer,text[],text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.video_cancel_meeting(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.video_create_meeting(text,text,timestamptz,integer,text[],text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.video_cancel_meeting(uuid) TO authenticated;
COMMIT;

-- DESPUES de ejecutar, completar los correos que no aparecen en los perfiles existentes:
-- UPDATE public.video_members SET email='correo@domusalud.cl'
-- WHERE id='admin:ID_REAL_DEL_PERFIL';
-- Solo el administrador de Supabase debe asignar roles y vinculos Auth.
-- Para vincular una cuenta creada en Authentication > Users:
-- UPDATE public.video_members SET auth_user_id=(
--   SELECT id FROM auth.users WHERE lower(email)='correo@domusalud.cl' AND email_confirmed_at IS NOT NULL
-- ) WHERE id='admin:ID_REAL_DEL_PERFIL';
-- Verificar el directorio (NO contiene contrasenas ni datos clinicos):
-- SELECT id,display_name,email,role,active,auth_user_id IS NOT NULL AS auth_vinculado
-- FROM public.video_members ORDER BY role,display_name;
