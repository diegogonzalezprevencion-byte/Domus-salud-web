-- DOMUS SALUD · fase 1, correo del organizador y cupos de pantalla.
-- Ejecutar DESPUÉS de las migraciones actuales. No borrar datos ni repetir migraciones iniciales.
BEGIN;

-- Repara sólo los estados antiguos de organizadores sin correo, para reuniones futuras.
UPDATE public.video_meeting_participants p
SET email_status = CASE WHEN m.email IS NULL THEN 'missing_email' ELSE 'not_configured' END
FROM public.video_meetings r, public.video_members m
WHERE p.meeting_id=r.id AND p.member_id=r.organizer_id AND m.id=r.organizer_id
  AND r.status='scheduled' AND r.starts_at>now()
  AND p.email_status='not_applicable';

-- Se generan correos pendientes de organizadores futuros aún no notificados.
-- ON CONFLICT evita duplicaciones y conserva estados previos de envío.
INSERT INTO public.video_email_outbox(meeting_id,member_id,recipient_email,event_type)
SELECT r.id, m.id, m.email, 'invitation'
FROM public.video_meetings r
JOIN public.video_members m ON m.id=r.organizer_id
WHERE r.status='scheduled' AND r.starts_at>now() AND m.email IS NOT NULL
ON CONFLICT(meeting_id,member_id,event_type) DO NOTHING;

-- Nuevas reuniones: genera participante y correo de organizador e invitados por igual.
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
         CASE WHEN m.email IS NULL THEN 'missing_email' ELSE 'not_configured' END
  FROM public.video_members m
  WHERE m.id=v_organizer OR m.id=ANY(v_participants);

  INSERT INTO public.video_email_outbox (meeting_id,member_id,recipient_email)
  SELECT v_meeting,m.id,m.email
  FROM public.video_members m
  WHERE (m.id=v_organizer OR m.id=ANY(v_participants)) AND m.email IS NOT NULL;

  RETURN v_meeting;
END;
$$;


REVOKE ALL ON FUNCTION public.video_create_meeting(text,text,timestamptz,integer,text[],text)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.video_create_meeting(text,text,timestamptz,integer,text[],text)
  TO authenticated;

-- Reserva atómica por reunión para un máximo de DOS pantallas compartidas.
-- Los cupos caducan si se cierra abruptamente el navegador; renovación cada 10 s.
CREATE TABLE IF NOT EXISTS public.video_screen_leases (
 meeting_id uuid NOT NULL REFERENCES public.video_meetings(id) ON DELETE CASCADE,
 member_id text NOT NULL REFERENCES public.video_members(id) ON DELETE CASCADE,
 lease_id uuid NOT NULL DEFAULT gen_random_uuid(),
 expires_at timestamptz NOT NULL,
 PRIMARY KEY(meeting_id,member_id)
);
CREATE INDEX IF NOT EXISTS video_screen_leases_expiry ON public.video_screen_leases(expires_at);
ALTER TABLE public.video_screen_leases ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.video_screen_leases FROM PUBLIC,anon,authenticated;
-- No SELECT directo: toda operación valida identidad con Supabase Auth.

CREATE OR REPLACE FUNCTION public.video_screen_claim(p_meeting_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_member text; v_meeting uuid; v_lease uuid;
BEGIN
  SELECT m.id INTO v_member FROM public.video_members m
    JOIN public.video_meeting_participants p ON p.member_id=m.id
    WHERE m.auth_user_id=(SELECT auth.uid()) AND m.active AND p.meeting_id=p_meeting_id;
  IF v_member IS NULL THEN RAISE EXCEPTION 'No estás invitado a la reunión.' USING ERRCODE='42501'; END IF;
  SELECT r.id INTO v_meeting FROM public.video_meetings r
    WHERE r.id=p_meeting_id AND r.status='scheduled'
      AND now() BETWEEN r.starts_at-interval '15 minutes'
      AND r.starts_at+(r.duration_minutes+15)*interval '1 minute'
    FOR UPDATE;
  IF v_meeting IS NULL THEN RAISE EXCEPTION 'La reunión no está activa.' USING ERRCODE='22023'; END IF;
  DELETE FROM public.video_screen_leases WHERE meeting_id=p_meeting_id AND expires_at<=now();
  IF EXISTS(SELECT 1 FROM public.video_screen_leases WHERE meeting_id=p_meeting_id AND member_id=v_member) THEN
    RAISE EXCEPTION 'Ya compartes pantalla desde otra pestaña. Detén ese envío primero.' USING ERRCODE='22023';
  END IF;
  IF (SELECT count(*) FROM public.video_screen_leases WHERE meeting_id=p_meeting_id)>=2 THEN
    RAISE EXCEPTION 'Ya hay dos personas compartiendo pantalla. Espera a que una finalice.' USING ERRCODE='22023';
  END IF;
  INSERT INTO public.video_screen_leases(meeting_id,member_id,expires_at)
  VALUES (p_meeting_id,v_member,now()+interval '35 seconds') RETURNING lease_id INTO v_lease;
  RETURN v_lease;
END; $$;

CREATE OR REPLACE FUNCTION public.video_screen_touch(p_meeting_id uuid,p_lease_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_member text;
BEGIN
  SELECT id INTO v_member FROM public.video_members
    WHERE auth_user_id=(SELECT auth.uid()) AND active;
  UPDATE public.video_screen_leases SET expires_at=now()+interval '35 seconds'
    WHERE meeting_id=p_meeting_id AND member_id=v_member AND lease_id=p_lease_id AND expires_at>now();
  RETURN FOUND;
END; $$;

CREATE OR REPLACE FUNCTION public.video_screen_release(p_meeting_id uuid,p_lease_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_member text;
BEGIN
  SELECT id INTO v_member FROM public.video_members
    WHERE auth_user_id=(SELECT auth.uid()) AND active;
  DELETE FROM public.video_screen_leases
    WHERE meeting_id=p_meeting_id AND member_id=v_member AND lease_id=p_lease_id;
  RETURN FOUND;
END; $$;
REVOKE ALL ON FUNCTION public.video_screen_claim(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.video_screen_touch(uuid,uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.video_screen_release(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.video_screen_claim(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.video_screen_touch(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.video_screen_release(uuid,uuid) TO authenticated;
COMMIT;
