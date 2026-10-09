-- DOMUS SALUD · Fase 2 · Enlaces para invitados externos (SIN cuentas Domus).
-- SOLO después de la fase 1. No elimina reuniones, actas, chat ni transcripciones.
-- Regla de privacidad conservadora: una reunión con enlace externo queda SIN NUEVAS TRANSCRIPCIONES
-- incluso si luego se revoca el enlace. Para transcribir, programa una nueva reunión interna.
BEGIN;

CREATE TABLE IF NOT EXISTS public.video_guest_links (
  meeting_id uuid PRIMARY KEY REFERENCES public.video_meetings(id) ON DELETE CASCADE,
  id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);
CREATE TABLE IF NOT EXISTS public.video_guest_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES public.video_meetings(id) ON DELETE CASCADE,
  link_id uuid NOT NULL,
  identity text NOT NULL UNIQUE,
  display_name text NOT NULL CHECK (length(btrim(display_name)) BETWEEN 2 AND 80),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS video_guest_entries_meeting ON public.video_guest_entries(meeting_id,link_id);
ALTER TABLE public.video_guest_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_guest_entries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.video_guest_links, public.video_guest_entries FROM PUBLIC, anon, authenticated;
-- No políticas de lectura pública: el enlace secreto se verifica exclusivamente en Vercel.

-- Administrador autenticado verificado en /api/video-guests antes de transmitir su UUID.
-- Sin acceso RPC directo para anon/authenticated. Siempre serializa con la fila de la reunión.
CREATE OR REPLACE FUNCTION public.video_guest_link_status(p_meeting_id uuid,p_actor uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_link public.video_guest_links%ROWTYPE;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.video_meetings r JOIN public.video_members m ON m.id=r.organizer_id
    WHERE r.id=p_meeting_id AND m.auth_user_id=p_actor AND m.active AND m.role='admin'
  ) THEN RAISE EXCEPTION 'Solo el organizador puede gestionar el enlace.' USING ERRCODE='42501'; END IF;
  SELECT * INTO v_link FROM public.video_guest_links WHERE meeting_id=p_meeting_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('exists',false); END IF;
  RETURN jsonb_build_object('exists',true,'id',v_link.id,'revoked',v_link.revoked_at IS NOT NULL,
                            'expiresAt',v_link.expires_at);
END; $$;

CREATE OR REPLACE FUNCTION public.video_guest_link_create(p_meeting_id uuid,p_actor uuid,p_token_hash text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_meeting public.video_meetings%ROWTYPE; v_existing public.video_guest_links%ROWTYPE;
        v_id uuid := gen_random_uuid(); v_expiry timestamptz;
BEGIN
  IF p_token_hash IS NULL OR p_token_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Código de enlace inválido.' USING ERRCODE='22023'; END IF;
  SELECT * INTO v_meeting FROM public.video_meetings WHERE id=p_meeting_id FOR UPDATE;
  IF NOT FOUND OR v_meeting.status <> 'scheduled' OR
      now() >= v_meeting.starts_at+(v_meeting.duration_minutes+15)*interval '1 minute' THEN
    RAISE EXCEPTION 'La reunión no está disponible.' USING ERRCODE='22023'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.video_members WHERE id=v_meeting.organizer_id
      AND auth_user_id=p_actor AND active AND role='admin'
  ) THEN RAISE EXCEPTION 'Solo el organizador puede crear el enlace.' USING ERRCODE='42501'; END IF;
  -- Impide abrir la sala a externos si un agente se inició previamente (puede seguir conectado).
  IF EXISTS (SELECT 1 FROM public.video_transcription_runs WHERE meeting_id=p_meeting_id) THEN
    RAISE EXCEPTION 'Esta reunión ya utilizó transcripción. Crea una reunión nueva para invitados externos.' USING ERRCODE='22023';
  END IF;
  SELECT * INTO v_existing FROM public.video_guest_links WHERE meeting_id=p_meeting_id FOR UPDATE;
  IF FOUND AND v_existing.revoked_at IS NULL AND v_existing.expires_at>now() THEN
    RAISE EXCEPTION 'Ya existe un enlace activo. Revócalo antes de crear otro.' USING ERRCODE='22023';
  END IF;
  v_expiry := v_meeting.starts_at + (v_meeting.duration_minutes+15)*interval '1 minute';
  INSERT INTO public.video_guest_links(meeting_id,id,token_hash,expires_at,created_at,revoked_at)
  VALUES(p_meeting_id,v_id,p_token_hash,v_expiry,now(),NULL)
  ON CONFLICT(meeting_id) DO UPDATE SET id=EXCLUDED.id,token_hash=EXCLUDED.token_hash,
    expires_at=EXCLUDED.expires_at,created_at=now(),revoked_at=NULL;
  RETURN jsonb_build_object('id',v_id,'expiresAt',v_expiry);
END; $$;

CREATE OR REPLACE FUNCTION public.video_guest_link_revoke(p_meeting_id uuid,p_actor uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_meeting public.video_meetings%ROWTYPE; v_link public.video_guest_links%ROWTYPE;
BEGIN
  SELECT * INTO v_meeting FROM public.video_meetings WHERE id=p_meeting_id FOR UPDATE;
  IF NOT FOUND OR NOT EXISTS(
    SELECT 1 FROM public.video_members WHERE id=v_meeting.organizer_id AND auth_user_id=p_actor
      AND active AND role='admin') THEN
    RAISE EXCEPTION 'Solo el organizador puede revocar enlaces.' USING ERRCODE='42501'; END IF;
  UPDATE public.video_guest_links SET revoked_at=coalesce(revoked_at,now())
    WHERE meeting_id=p_meeting_id RETURNING * INTO v_link;
  IF NOT FOUND THEN RETURN jsonb_build_object('exists',false); END IF;
  RETURN jsonb_build_object('exists',true,'id',v_link.id);
END; $$;

-- Información pública mínima SOLAMENTE después de validar el hash del enlace.
CREATE OR REPLACE FUNCTION public.video_guest_link_preview(p_token_hash text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT jsonb_build_object('title',r.title,'startsAt',r.starts_at,
    'duration',r.duration_minutes,'expiresAt',l.expires_at)
  FROM public.video_guest_links l JOIN public.video_meetings r ON r.id=l.meeting_id
  WHERE l.token_hash=p_token_hash AND l.revoked_at IS NULL AND l.expires_at>now()
    AND r.status='scheduled' AND now()<r.starts_at+(r.duration_minutes+15)*interval '1 minute';
$$;

-- Resuelve ID opaco de enlace sólo en servidor (necesario para la identidad LiveKit).
CREATE OR REPLACE FUNCTION public.video_guest_link_lookup(p_token_hash text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT jsonb_build_object('id',l.id)
  FROM public.video_guest_links l JOIN public.video_meetings r ON r.id=l.meeting_id
  WHERE l.token_hash=p_token_hash AND l.revoked_at IS NULL AND l.expires_at>now()
    AND r.status='scheduled';
$$;

-- Otorgamiento atómico: Vercel genera identidad opaca; no acepta meeting_id desde el invitado.
CREATE OR REPLACE FUNCTION public.video_guest_join(p_token_hash text,p_identity text,p_display_name text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_link public.video_guest_links%ROWTYPE; v_meeting public.video_meetings%ROWTYPE;
BEGIN
  IF p_token_hash IS NULL OR p_token_hash !~ '^[0-9a-f]{64}$'
    OR p_identity IS NULL OR p_identity !~ '^guest:[0-9a-f-]{36}:[0-9a-f-]{36}$'
    OR p_display_name IS NULL OR length(btrim(p_display_name)) NOT BETWEEN 2 AND 80 THEN
    RETURN NULL; END IF;
  SELECT * INTO v_link FROM public.video_guest_links WHERE token_hash=p_token_hash;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT * INTO v_meeting FROM public.video_meetings WHERE id=v_link.meeting_id FOR UPDATE;
  -- Releer después del bloqueo: una revocación concurrente no puede pasar inadvertida.
  SELECT * INTO v_link FROM public.video_guest_links WHERE token_hash=p_token_hash FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF v_meeting.status<>'scheduled' OR v_link.id::text <> split_part(p_identity,':',2)
    OR v_link.revoked_at IS NOT NULL OR v_link.expires_at<=now()
    OR now() NOT BETWEEN v_meeting.starts_at-interval '15 minutes'
          AND v_meeting.starts_at+(v_meeting.duration_minutes+15)*interval '1 minute'
    OR EXISTS(SELECT 1 FROM public.video_transcription_runs
              WHERE meeting_id=v_link.meeting_id AND status<>'stopped') THEN RETURN NULL; END IF;
  -- 100 accesos por enlace como contención simple de uso excesivo; no se exponen a anon.
  IF (SELECT count(*) FROM public.video_guest_entries WHERE link_id=v_link.id)>=100 THEN RETURN NULL; END IF;
  INSERT INTO public.video_guest_entries(meeting_id,link_id,identity,display_name)
    VALUES(v_link.meeting_id,v_link.id,p_identity,btrim(p_display_name));
  RETURN jsonb_build_object('meetingId',v_link.meeting_id,'title',v_meeting.title,
      'identity',p_identity,'name',btrim(p_display_name));
END; $$;

-- Una reunión que abrió enlaces externos NUNCA podrá iniciar nuevas transcripciones.
-- Es deliberado: el consentimiento anterior solo incluye miembros registrados y no invitados.
-- Sobreescribimos las tres puertas de captura, todas bajo el mismo bloqueo de reunión.
CREATE OR REPLACE FUNCTION public.video_transcription_begin(p_meeting_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_member text;
  v_meeting public.video_meetings%ROWTYPE;
  v_run uuid := gen_random_uuid();
  v_actual uuid;
BEGIN
  SELECT id INTO v_member FROM public.video_members
    WHERE auth_user_id = (SELECT auth.uid()) AND active AND role = 'admin';
  IF v_member IS NULL THEN
    RAISE EXCEPTION 'Solo un administrador autenticado puede iniciar la transcripción.' USING ERRCODE='42501';
  END IF;
  SELECT * INTO v_meeting FROM public.video_meetings
    WHERE id = p_meeting_id FOR UPDATE;
  IF NOT FOUND OR v_meeting.status <> 'scheduled' THEN
    RAISE EXCEPTION 'Reunión no disponible.' USING ERRCODE='22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.video_meeting_participants
                 WHERE meeting_id=p_meeting_id AND member_id=v_member) THEN
    RAISE EXCEPTION 'Debes estar invitado a la reunión.' USING ERRCODE='42501';
  END IF;
  IF now() < v_meeting.starts_at - interval '15 minutes'
     OR now() > v_meeting.starts_at + v_meeting.duration_minutes * interval '1 minute' + interval '15 minutes' THEN
    RAISE EXCEPTION 'Fuera del horario permitido de la reunión.' USING ERRCODE='22023';
  END IF;
  IF EXISTS (SELECT 1 FROM public.video_guest_links WHERE meeting_id=p_meeting_id) THEN
    RAISE EXCEPTION 'Esta reunión tiene o tuvo invitados externos. No se permite transcribirla. Crea una reunión interna nueva.' USING ERRCODE='42501';
  END IF;
  IF NOT public.video_all_consented(p_meeting_id) THEN
    RAISE EXCEPTION 'Todos los invitados deben dar su consentimiento antes de comenzar.' USING ERRCODE='42501';
  END IF;
  INSERT INTO public.video_transcription_runs
    (meeting_id,status,run_id,dispatch_id,updated_at,initiated_by)
  VALUES (p_meeting_id,'starting',v_run,NULL,now(),v_member)
  ON CONFLICT (meeting_id) DO UPDATE
    SET status='starting', run_id=EXCLUDED.run_id, dispatch_id=NULL,
        updated_at=now(), initiated_by=EXCLUDED.initiated_by
    WHERE public.video_transcription_runs.status='stopped'
  RETURNING run_id INTO v_actual;
  IF v_actual IS NULL THEN
    RAISE EXCEPTION 'Ya existe una transcripción iniciada o preparándose.' USING ERRCODE='22023';
  END IF;
  RETURN v_actual;
END; $$;

CREATE OR REPLACE FUNCTION public.video_transcription_confirm(
  p_meeting_id uuid, p_run_id uuid, p_dispatch_id text
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF p_dispatch_id IS NULL OR length(btrim(p_dispatch_id)) < 3 THEN
    RETURN false;
  END IF;
  -- Serializar con el bloqueo utilizado por el consentimiento y la revocación.
  -- Sin esto, otra transacción podría retirar su permiso entre la lectura y
  -- la confirmación del despacho.
  PERFORM 1 FROM public.video_meetings
    WHERE id=p_meeting_id AND status='scheduled' FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  UPDATE public.video_transcription_runs
  SET status='active', dispatch_id=p_dispatch_id, updated_at=now()
  WHERE meeting_id=p_meeting_id AND run_id=p_run_id AND status='starting'
    AND public.video_all_consented(p_meeting_id)
    AND NOT EXISTS (SELECT 1 FROM public.video_guest_links WHERE meeting_id=p_meeting_id);
  RETURN FOUND;
END; $$;

CREATE OR REPLACE FUNCTION public.video_transcription_write_segment(
  p_meeting_id uuid, p_run_id uuid, p_member_id text,
  p_segment_key text, p_content text, p_starts_at timestamptz, p_ends_at timestamptz
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM 1 FROM public.video_meetings
    WHERE id=p_meeting_id AND status='scheduled' FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF NOT EXISTS (
     SELECT 1 FROM public.video_transcription_runs
     WHERE meeting_id=p_meeting_id AND run_id=p_run_id AND status='active'
  ) OR EXISTS (SELECT 1 FROM public.video_guest_links WHERE meeting_id=p_meeting_id)
    OR NOT public.video_all_consented(p_meeting_id) OR NOT EXISTS (
     SELECT 1 FROM public.video_meeting_participants p
     JOIN public.video_members m ON m.id=p.member_id
     WHERE p.meeting_id=p_meeting_id AND p.member_id=p_member_id AND m.active
  ) THEN RETURN false; END IF;
  IF p_content IS NULL OR length(btrim(p_content)) NOT BETWEEN 1 AND 8000
     OR p_segment_key IS NULL OR length(p_segment_key) NOT BETWEEN 1 AND 128
     OR p_starts_at IS NULL OR (p_ends_at IS NOT NULL AND p_ends_at < p_starts_at) THEN
    RETURN false;
  END IF;
  INSERT INTO public.video_transcript_segments
    (meeting_id,member_id,segment_key,content,starts_at,ends_at)
  VALUES(p_meeting_id,p_member_id,p_segment_key,btrim(p_content),p_starts_at,p_ends_at)
  ON CONFLICT(meeting_id,segment_key) DO NOTHING;
  RETURN true;
END; $$;

-- RPC de bandera no sensible; solo los miembros registrados invitados pueden verla.
CREATE OR REPLACE FUNCTION public.video_guest_meeting_enabled(p_meeting_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.video_members m
    JOIN public.video_meeting_participants p ON p.member_id=m.id
    WHERE p.meeting_id=p_meeting_id AND m.auth_user_id=(SELECT auth.uid()) AND m.active
  ) AND EXISTS (SELECT 1 FROM public.video_guest_links WHERE meeting_id=p_meeting_id);
$$;
REVOKE ALL ON FUNCTION public.video_guest_meeting_enabled(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.video_guest_meeting_enabled(uuid) TO authenticated;

-- Las actas de reuniones externas son 100% manuales; no se exige transcripción.
-- Las reuniones internas mantienen EXACTAMENTE la condición previa de fragmentos.
CREATE OR REPLACE FUNCTION public.video_minutes_create_template(
  p_meeting_id uuid,
  p_replace_draft boolean DEFAULT false,
  p_expected_revision integer DEFAULT NULL
)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_member text;
  v_status text;
  v_run text;
  v_count integer;
  v_revision integer;
  v_existing public.video_meeting_minutes%ROWTYPE;
BEGIN
  IF NOT public.video_minutes_admin(p_meeting_id) THEN
    RAISE EXCEPTION 'Solo un administrador invitado puede crear actas.' USING ERRCODE='42501';
  END IF;
  SELECT status INTO v_status FROM public.video_meetings WHERE id=p_meeting_id FOR UPDATE;
  IF v_status IS DISTINCT FROM 'scheduled' THEN
    RAISE EXCEPTION 'La reunión no está disponible.' USING ERRCODE='22023';
  END IF;
  SELECT status INTO v_run FROM public.video_transcription_runs WHERE meeting_id=p_meeting_id;
  IF v_run IS NOT NULL AND v_run <> 'stopped' THEN
    RAISE EXCEPTION 'Detén primero la transcripción.' USING ERRCODE='22023';
  END IF;
  SELECT COUNT(*) INTO v_count FROM public.video_transcript_segments WHERE meeting_id=p_meeting_id;
  IF v_count=0 AND NOT EXISTS(
    SELECT 1 FROM public.video_guest_links WHERE meeting_id=p_meeting_id
  ) THEN
    RAISE EXCEPTION 'No hay transcripción guardada para esta reunión.' USING ERRCODE='22023';
  END IF;
  SELECT id INTO v_member FROM public.video_members WHERE auth_user_id=(SELECT auth.uid()) AND active AND role='admin';
  SELECT * INTO v_existing FROM public.video_meeting_minutes WHERE meeting_id=p_meeting_id FOR UPDATE;
  IF FOUND THEN
    IF v_existing.status='approved' THEN
      RAISE EXCEPTION 'El acta está aprobada y no puede sustituirse.' USING ERRCODE='22023';
    END IF;
    IF NOT COALESCE(p_replace_draft,false) OR p_expected_revision IS DISTINCT FROM v_existing.revision THEN
      RAISE EXCEPTION 'El borrador existe o cambió. Recarga y confirma su reemplazo.' USING ERRCODE='40001';
    END IF;
    UPDATE public.video_meeting_minutes SET
      status='draft',summary='',topics='',agreements='',commitments='',pending='',notes='',
      source_segments=v_count,model='plantilla-local-sin-ia',
      generated_by=v_member,edited_by=v_member,approved_by=NULL,approved_at=NULL,
      generated_at=now(),updated_at=now(),revision=revision+1
    WHERE meeting_id=p_meeting_id RETURNING revision INTO v_revision;
  ELSE
    INSERT INTO public.video_meeting_minutes (
      meeting_id,status,source_segments,model,generated_by,edited_by
    ) VALUES (p_meeting_id,'draft',v_count,'plantilla-local-sin-ia',v_member,v_member)
    RETURNING revision INTO v_revision;
  END IF;
  RETURN v_revision;
END;
$$;

CREATE OR REPLACE FUNCTION public.video_minutes_approve(p_meeting_id uuid,p_revision integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_member text;v_new integer;
BEGIN
 IF NOT public.video_minutes_admin(p_meeting_id) THEN
   RAISE EXCEPTION 'Solo un administrador invitado puede aprobar.' USING ERRCODE='42501';
 END IF;
 SELECT id INTO v_member FROM public.video_members WHERE auth_user_id=(SELECT auth.uid()) AND active;
 UPDATE public.video_meeting_minutes SET status='approved',approved_at=now(),
   approved_by=v_member,updated_at=now(),revision=revision+1
 WHERE meeting_id=p_meeting_id AND status='draft' AND revision=p_revision
   AND length(btrim(summary))>0
   AND (source_segments>0 OR EXISTS(
     SELECT 1 FROM public.video_guest_links WHERE meeting_id=p_meeting_id
   ))
   AND NOT EXISTS(SELECT 1 FROM public.video_transcription_runs r
                  WHERE r.meeting_id=p_meeting_id AND r.status<>'stopped')
 RETURNING revision INTO v_new;
 RETURN v_new IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.video_minutes_create_template(uuid,boolean,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.video_minutes_create_template(uuid,boolean,integer) TO authenticated;
REVOKE ALL ON FUNCTION public.video_minutes_approve(uuid,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.video_minutes_approve(uuid,integer) TO authenticated;

-- RPCs de invitación accesibles ÚNICAMENTE por Vercel mediante service_role.
DO $$ BEGIN
  -- Verifica que las funciones previas existen antes de crear este bloque.
  IF to_regprocedure('public.video_transcription_begin(uuid)') IS NULL THEN
    RAISE EXCEPTION 'Ejecuta primero el SQL previo de transcripción.';
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.video_guest_link_status(uuid,uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.video_guest_link_create(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.video_guest_link_revoke(uuid,uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.video_guest_link_preview(text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.video_guest_link_lookup(text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.video_guest_join(text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.video_guest_link_status(uuid,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.video_guest_link_create(uuid,uuid,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.video_guest_link_revoke(uuid,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.video_guest_link_preview(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.video_guest_link_lookup(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.video_guest_join(text,text,text) TO service_role;
COMMIT;
