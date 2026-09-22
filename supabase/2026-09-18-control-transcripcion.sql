-- DOMUS SALUD | Control de ejecuciones de transcripción.
-- Ejecutar DESPUÉS de la migración de consentimiento y segmentos ya instalada.
-- No elimina reuniones, consentimientos, transcripciones ni fichas clínicas.
BEGIN;

CREATE TABLE IF NOT EXISTS public.video_transcription_runs (
  meeting_id uuid PRIMARY KEY REFERENCES public.video_meetings(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'stopped'
    CHECK (status IN ('stopped', 'starting', 'active')),
  run_id uuid NOT NULL DEFAULT gen_random_uuid(),
  dispatch_id text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  initiated_by text REFERENCES public.video_members(id) ON DELETE SET NULL
);

ALTER TABLE public.video_transcription_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.video_transcription_runs FROM anon, authenticated;
GRANT SELECT ON public.video_transcription_runs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_transcription_runs TO service_role;

DROP POLICY IF EXISTS video_transcription_runs_read ON public.video_transcription_runs;
CREATE POLICY video_transcription_runs_read ON public.video_transcription_runs
  FOR SELECT TO authenticated
  USING (public.video_is_meeting_participant(meeting_id));

-- Impide dos despachos simultáneos y verifica consentimiento dentro de la
-- misma transacción. El bloqueo de video_meetings se comparte con revocación.
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

-- El servicio confirma un despacho solo si ninguna persona retiró su permiso
-- durante la llamada a LiveKit. De lo contrario, Vercel elimina el despacho.
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
    AND public.video_all_consented(p_meeting_id);
  RETURN FOUND;
END; $$;

-- Detención por invitado (o administrador invitado): la base deja de autorizar
-- la captura ANTES de solicitar a LiveKit que elimine el despacho.
CREATE OR REPLACE FUNCTION public.video_transcription_stop(p_meeting_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_member text;
  v_dispatch text;
BEGIN
  SELECT id INTO v_member FROM public.video_members
    WHERE auth_user_id=(SELECT auth.uid()) AND active;
  IF v_member IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.video_meeting_participants
      WHERE meeting_id=p_meeting_id AND member_id=v_member
  ) THEN
    RAISE EXCEPTION 'Solo un participante autorizado puede detener la transcripción.' USING ERRCODE='42501';
  END IF;
  PERFORM 1 FROM public.video_meetings WHERE id=p_meeting_id FOR UPDATE;
  UPDATE public.video_transcription_runs
  SET status='stopped', updated_at=now()
  WHERE meeting_id=p_meeting_id
  RETURNING dispatch_id INTO v_dispatch;
  RETURN v_dispatch;
END; $$;

-- Sustituye la función previa de consentimiento para que rechazar o revocar
-- cambie inmediatamente el estado a STOPPED, aunque falle una petición web.
CREATE OR REPLACE FUNCTION public.video_set_transcription_consent(
  p_meeting_id uuid, p_accepted boolean
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_member text;
BEGIN
  IF p_accepted IS NULL THEN
    RAISE EXCEPTION 'Indica si aceptas o rechazas la transcripción.' USING ERRCODE='22023';
  END IF;
  -- Mismo bloqueo de reunión que en video_transcription_begin.
  PERFORM 1 FROM public.video_meetings
    WHERE id=p_meeting_id AND status='scheduled' FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reunión no disponible.' USING ERRCODE='22023';
  END IF;
  SELECT m.id INTO v_member
  FROM public.video_members m
  JOIN public.video_meeting_participants p ON p.member_id=m.id
  WHERE m.auth_user_id=(SELECT auth.uid()) AND m.active
    AND p.meeting_id=p_meeting_id;
  IF v_member IS NULL THEN
    RAISE EXCEPTION 'No estás invitado a esta reunión.' USING ERRCODE='42501';
  END IF;
  INSERT INTO public.video_transcription_consent(meeting_id,member_id,accepted,decided_at)
  VALUES(p_meeting_id,v_member,p_accepted,now())
  ON CONFLICT(meeting_id,member_id) DO UPDATE
    SET accepted=EXCLUDED.accepted, decided_at=now();
  IF NOT p_accepted THEN
    UPDATE public.video_transcription_runs
    SET status='stopped',updated_at=now()
    WHERE meeting_id=p_meeting_id AND status <> 'stopped';
  END IF;
  RETURN true;
END; $$;

REVOKE ALL ON FUNCTION public.video_transcription_begin(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.video_transcription_confirm(uuid,uuid,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.video_transcription_stop(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.video_set_transcription_consent(uuid,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.video_transcription_begin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.video_transcription_stop(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.video_set_transcription_consent(uuid,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.video_transcription_confirm(uuid,uuid,text) TO service_role;

-- Grabación atomizada: jamás guardar un fragmento después de que una revocación
-- adquirió el bloqueo de la reunión. No confiar en escrituras directas del agente.
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
  ) OR NOT public.video_all_consented(p_meeting_id) OR NOT EXISTS (
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

REVOKE ALL ON FUNCTION public.video_transcription_write_segment(
  uuid,uuid,text,text,text,timestamptz,timestamptz
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.video_transcription_write_segment(
  uuid,uuid,text,text,text,timestamptz,timestamptz
) TO service_role;


-- Restaurar la disponibilidad del botón si el agente termina inesperadamente.
CREATE OR REPLACE FUNCTION public.video_transcription_agent_finished(
  p_meeting_id uuid, p_run_id uuid
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.video_transcription_runs
  SET status='stopped', updated_at=now()
  WHERE meeting_id=p_meeting_id AND run_id=p_run_id;
  RETURN FOUND;
END; $$;
REVOKE ALL ON FUNCTION public.video_transcription_agent_finished(uuid,uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.video_transcription_agent_finished(uuid,uuid)
  TO service_role;

COMMIT;
