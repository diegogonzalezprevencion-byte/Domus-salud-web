-- DOMUS SALUD · FASE 3 · Paridad de funciones en reunión.
-- Ejecutar después de las fases 1 y 2. Probar primero en proyecto de staging.
-- Requiere desplegar también web y agente transcriptor actualizados.
BEGIN;

-- Un secreto de sesión distinto por cada acceso; solo se persiste SHA-256.
ALTER TABLE public.video_guest_entries ADD COLUMN IF NOT EXISTS session_hash text;
ALTER TABLE public.video_guest_entries DROP CONSTRAINT IF EXISTS video_guest_entries_session_hash_check;
ALTER TABLE public.video_guest_entries ADD CONSTRAINT video_guest_entries_session_hash_check
  CHECK (session_hash IS NULL OR session_hash ~ '^[0-9a-f]{64}$');
CREATE INDEX IF NOT EXISTS video_guest_entries_session_idx ON public.video_guest_entries(identity,session_hash);

CREATE TABLE IF NOT EXISTS public.video_guest_screen_leases (
 meeting_id uuid NOT NULL REFERENCES public.video_meetings(id) ON DELETE CASCADE,
 identity text NOT NULL REFERENCES public.video_guest_entries(identity) ON DELETE CASCADE,
 lease_id uuid NOT NULL DEFAULT gen_random_uuid(),
 expires_at timestamptz NOT NULL,
 PRIMARY KEY(meeting_id,identity)
);
CREATE INDEX IF NOT EXISTS video_guest_screen_expiry ON public.video_guest_screen_leases(meeting_id,expires_at);
ALTER TABLE public.video_guest_screen_leases ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.video_guest_screen_leases FROM PUBLIC,anon,authenticated;

-- Los participantes internos pueden consultar el nombre de invitados, no sus sesiones secretas.
DROP POLICY IF EXISTS video_members_guest_name ON public.video_members;
CREATE POLICY video_members_guest_name ON public.video_members FOR SELECT TO authenticated
  USING (id LIKE 'guest:%' AND EXISTS (
    SELECT 1 FROM public.video_meeting_participants p
    WHERE p.member_id=id AND public.video_is_meeting_participant(p.meeting_id)
  ));

-- El backend llama esta función con secreto SHA-256 validado. No se expone al navegador.
CREATE OR REPLACE FUNCTION public.video_guest_session(p_identity text,p_session_hash text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT jsonb_build_object('meetingId',e.meeting_id,'name',e.display_name,'identity',e.identity)
 FROM public.video_guest_entries e
 JOIN public.video_guest_links l ON l.meeting_id=e.meeting_id AND l.id=e.link_id
 JOIN public.video_meetings m ON m.id=e.meeting_id
 WHERE e.identity=p_identity AND e.session_hash=p_session_hash
 AND p_session_hash ~ '^[0-9a-f]{64}$' AND l.revoked_at IS NULL
 AND l.expires_at>now() AND m.status='scheduled'
 AND now() BETWEEN m.starts_at-interval '15 minutes'
              AND m.starts_at+(m.duration_minutes+15)*interval '1 minute';
$$;
REVOKE ALL ON FUNCTION public.video_guest_session(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.video_guest_session(text,text) TO service_role;

-- Nueva firma, con secreto de sesión, para invitados que también participan en los
-- permisos, consentimientos, chat y atribución de voz. La anterior queda sin EXECUTE.
CREATE OR REPLACE FUNCTION public.video_guest_join(
 p_token_hash text,p_identity text,p_display_name text,p_session_hash text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_link public.video_guest_links%ROWTYPE; v_meeting public.video_meetings%ROWTYPE;
BEGIN
 IF p_token_hash IS NULL OR p_token_hash !~ '^[0-9a-f]{64}$'
 OR p_session_hash IS NULL OR p_session_hash !~ '^[0-9a-f]{64}$'
 OR p_identity IS NULL OR p_identity !~ '^guest:[0-9a-f-]{36}:[0-9a-f-]{36}$'
 OR length(btrim(coalesce(p_display_name,''))) NOT BETWEEN 2 AND 80 THEN RETURN NULL; END IF;
 SELECT * INTO v_link FROM public.video_guest_links WHERE token_hash=p_token_hash;
 IF NOT FOUND THEN RETURN NULL; END IF;
 SELECT * INTO v_meeting FROM public.video_meetings WHERE id=v_link.meeting_id FOR UPDATE;
 SELECT * INTO v_link FROM public.video_guest_links WHERE token_hash=p_token_hash FOR UPDATE;
 IF NOT FOUND OR v_meeting.status<>'scheduled' OR v_link.revoked_at IS NOT NULL
 OR v_link.id::text<>split_part(p_identity,':',2) OR v_link.expires_at<=now()
 OR now() NOT BETWEEN v_meeting.starts_at-interval '15 minutes'
 AND v_meeting.starts_at+(v_meeting.duration_minutes+15)*interval '1 minute'
 OR EXISTS (SELECT 1 FROM public.video_transcription_runs
            WHERE meeting_id=v_link.meeting_id AND status<>'stopped')
 OR (SELECT count(*) FROM public.video_guest_entries WHERE link_id=v_link.id)>=100
 THEN RETURN NULL; END IF;
 INSERT INTO public.video_guest_entries(meeting_id,link_id,identity,display_name,session_hash)
 VALUES(v_link.meeting_id,v_link.id,p_identity,btrim(p_display_name),p_session_hash);
 INSERT INTO public.video_members(id,display_name,email,role,active)
 VALUES(p_identity,btrim(p_display_name),NULL,'professional',true);
 INSERT INTO public.video_meeting_participants(meeting_id,member_id,participation_status,email_status)
 VALUES(v_link.meeting_id,p_identity,'invited','missing_email');
 RETURN jsonb_build_object('meetingId',v_link.meeting_id,'title',v_meeting.title,
   'identity',p_identity,'name',btrim(p_display_name));
END; $$;
REVOKE ALL ON FUNCTION public.video_guest_join(text,text,text) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.video_guest_join(text,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.video_guest_join(text,text,text,text) TO service_role;

-- Todos, incluidos invitados que hayan ingresado, deben consentir. Una revocación
-- invalida toda captura nueva en esa reunión, incluso si alguien aún está conectado.
CREATE OR REPLACE FUNCTION public.video_all_consented(p_meeting_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.video_meetings WHERE id=p_meeting_id AND status='scheduled')
 AND EXISTS(SELECT 1 FROM public.video_meeting_participants WHERE meeting_id=p_meeting_id)
 AND NOT EXISTS (
   SELECT 1 FROM public.video_meeting_participants p
   LEFT JOIN public.video_transcription_consent c
     ON c.meeting_id=p.meeting_id AND c.member_id=p.member_id
   WHERE p.meeting_id=p_meeting_id AND COALESCE(c.accepted,false)=false
 )
 AND NOT EXISTS (
   SELECT 1 FROM public.video_guest_entries e
   LEFT JOIN public.video_transcription_consent c
     ON c.meeting_id=e.meeting_id AND c.member_id=e.identity
   WHERE e.meeting_id=p_meeting_id AND COALESCE(c.accepted,false)=false
 )
 AND NOT EXISTS (
   SELECT 1 FROM public.video_guest_links l
   WHERE l.meeting_id=p_meeting_id AND l.revoked_at IS NOT NULL
 );
$$;
REVOKE ALL ON FUNCTION public.video_all_consented(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.video_all_consented(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.video_guest_set_consent(
 p_identity text,p_session_hash text,p_accepted boolean
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_meeting uuid;
BEGIN
 IF p_accepted IS NULL THEN RETURN false; END IF;
 SELECT e.meeting_id INTO v_meeting FROM public.video_guest_entries e
 WHERE e.identity=p_identity AND e.session_hash=p_session_hash;
 IF v_meeting IS NULL THEN RETURN false; END IF;
 PERFORM 1 FROM public.video_meetings WHERE id=v_meeting FOR UPDATE;
 IF public.video_guest_session(p_identity,p_session_hash) IS NULL THEN RETURN false; END IF;
 INSERT INTO public.video_transcription_consent(meeting_id,member_id,accepted,decided_at)
 VALUES(v_meeting,p_identity,p_accepted,now())
 ON CONFLICT(meeting_id,member_id) DO UPDATE SET accepted=EXCLUDED.accepted,decided_at=now();
 IF NOT p_accepted THEN
  UPDATE public.video_transcription_runs SET status='stopped',updated_at=now()
  WHERE meeting_id=v_meeting AND status<>'stopped';
 END IF;
 RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.video_guest_set_consent(text,text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.video_guest_set_consent(text,text,boolean) TO service_role;

-- Estado de permisos: devuelve solo nombres y texto transcrito de ESTA reunión.
CREATE OR REPLACE FUNCTION public.video_guest_transcription_status(p_identity text,p_session_hash text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_meeting uuid; v_data jsonb;
BEGIN
 SELECT e.meeting_id INTO v_meeting FROM public.video_guest_entries e
 WHERE e.identity=p_identity AND e.session_hash=p_session_hash;
 IF v_meeting IS NULL OR public.video_guest_session(p_identity,p_session_hash) IS NULL THEN RETURN NULL; END IF;
 SELECT jsonb_build_object(
  'status',coalesce((SELECT r.status FROM public.video_transcription_runs r WHERE r.meeting_id=v_meeting),'stopped'),
  'consents',coalesce((SELECT jsonb_agg(jsonb_build_object('id',p.member_id,'name',m.display_name,
                     'accepted',c.accepted) ORDER BY p.added_at)
                     FROM public.video_meeting_participants p JOIN public.video_members m ON m.id=p.member_id
                     LEFT JOIN public.video_transcription_consent c ON c.meeting_id=p.meeting_id AND c.member_id=p.member_id
                     WHERE p.meeting_id=v_meeting),'[]'::jsonb),
  'segments',coalesce((SELECT jsonb_agg(jsonb_build_object('id',s.id,'name',m.display_name,
                     'text',s.content,'time',s.starts_at) ORDER BY s.starts_at)
                     FROM (SELECT * FROM public.video_transcript_segments
                           WHERE meeting_id=v_meeting ORDER BY starts_at DESC LIMIT 100) s
                     JOIN public.video_members m ON m.id=s.member_id),'[]'::jsonb)
 ) INTO v_data;
 RETURN v_data;
END; $$;
REVOKE ALL ON FUNCTION public.video_guest_transcription_status(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.video_guest_transcription_status(text,text) TO service_role;

-- Un invitado con sesión verificada puede iniciar la misma transcripción; el consentimiento
-- es universal y el límite de consumo es el del proyecto LiveKit vigente.
CREATE OR REPLACE FUNCTION public.video_guest_transcription_begin(p_identity text,p_session_hash text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_meeting uuid; v_run uuid:=gen_random_uuid(); v_actual uuid;
BEGIN
 SELECT meeting_id INTO v_meeting FROM public.video_guest_entries
 WHERE identity=p_identity AND session_hash=p_session_hash;
 IF v_meeting IS NULL THEN RAISE EXCEPTION 'Sesión inválida.' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.video_meetings WHERE id=v_meeting FOR UPDATE;
 IF public.video_guest_session(p_identity,p_session_hash) IS NULL
 OR NOT public.video_all_consented(v_meeting) THEN
  RAISE EXCEPTION 'Faltan autorizaciones o terminó la reunión.' USING ERRCODE='42501';
 END IF;
 INSERT INTO public.video_transcription_runs(meeting_id,status,run_id,dispatch_id,updated_at,initiated_by)
 VALUES(v_meeting,'starting',v_run,NULL,now(),p_identity)
 ON CONFLICT(meeting_id) DO UPDATE SET status='starting',run_id=EXCLUDED.run_id,
 dispatch_id=NULL,updated_at=now(),initiated_by=EXCLUDED.initiated_by
 WHERE public.video_transcription_runs.status='stopped'
 RETURNING run_id INTO v_actual;
 IF v_actual IS NULL THEN RAISE EXCEPTION 'Ya hay transcripción activa.' USING ERRCODE='22023'; END IF;
 RETURN v_actual;
END; $$;
REVOKE ALL ON FUNCTION public.video_guest_transcription_begin(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.video_guest_transcription_begin(text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.video_guest_transcription_stop(p_identity text,p_session_hash text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_meeting uuid; v_dispatch text;
BEGIN
 SELECT meeting_id INTO v_meeting FROM public.video_guest_entries
 WHERE identity=p_identity AND session_hash=p_session_hash;
 IF v_meeting IS NULL THEN RAISE EXCEPTION 'Sesión inválida.' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.video_meetings WHERE id=v_meeting FOR UPDATE;
 IF public.video_guest_session(p_identity,p_session_hash) IS NULL THEN
  RAISE EXCEPTION 'Invitado no autorizado.' USING ERRCODE='42501'; END IF;
 UPDATE public.video_transcription_runs SET status='stopped',updated_at=now()
 WHERE meeting_id=v_meeting RETURNING dispatch_id INTO v_dispatch;
 RETURN v_dispatch;
END; $$;
REVOKE ALL ON FUNCTION public.video_guest_transcription_stop(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.video_guest_transcription_stop(text,text) TO service_role;

-- Chat único persistente para miembros e invitados. La inserción requiere sesión activa.
CREATE OR REPLACE FUNCTION public.video_guest_send_chat(p_identity text,p_session_hash text,p_body text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_meeting uuid; v_id uuid;
BEGIN
 SELECT meeting_id INTO v_meeting FROM public.video_guest_entries
 WHERE identity=p_identity AND session_hash=p_session_hash;
 IF v_meeting IS NULL OR public.video_guest_session(p_identity,p_session_hash) IS NULL
 OR length(btrim(coalesce(p_body,''))) NOT BETWEEN 1 AND 4000 THEN
  RAISE EXCEPTION 'Invitación vencida o mensaje incorrecto.' USING ERRCODE='42501';
 END IF;
 INSERT INTO public.video_chat_messages(meeting_id,sender_id,body)
 VALUES(v_meeting,p_identity,btrim(p_body)) RETURNING id INTO v_id;
 RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION public.video_guest_send_chat(text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.video_guest_send_chat(text,text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.video_guest_chat_history(p_identity text,p_session_hash text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT coalesce((SELECT jsonb_agg(jsonb_build_object('id',s.id,'senderId',s.sender_id,
   'name',m.display_name,'body',s.body,'time',s.created_at) ORDER BY s.created_at,s.id)
   FROM (SELECT c.* FROM public.video_chat_messages c
         WHERE c.meeting_id=e.meeting_id ORDER BY c.created_at DESC,c.id DESC LIMIT 100) s
   JOIN public.video_members m ON m.id=s.sender_id),'[]'::jsonb)
 FROM public.video_guest_entries e
 WHERE e.identity=p_identity AND e.session_hash=p_session_hash
 AND public.video_guest_session(p_identity,p_session_hash) IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION public.video_guest_chat_history(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.video_guest_chat_history(text,text) TO service_role;

-- Cupos compartidos en la MISMA transacción de bloqueo de video_meetings.
CREATE OR REPLACE FUNCTION public.video_screen_claim(p_meeting_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_member text; v_meeting uuid; v_lease uuid;
BEGIN
 SELECT m.id INTO v_member FROM public.video_members m
 JOIN public.video_meeting_participants p ON p.member_id=m.id
 WHERE m.auth_user_id=(SELECT auth.uid()) AND m.active AND p.meeting_id=p_meeting_id;
 IF v_member IS NULL THEN RAISE EXCEPTION 'No estás invitado a la reunión.' USING ERRCODE='42501'; END IF;
 SELECT id INTO v_meeting FROM public.video_meetings
 WHERE id=p_meeting_id AND status='scheduled'
 AND now() BETWEEN starts_at-interval '15 minutes'
 AND starts_at+(duration_minutes+15)*interval '1 minute' FOR UPDATE;
 IF v_meeting IS NULL THEN RAISE EXCEPTION 'Reunión fuera de horario.' USING ERRCODE='22023'; END IF;
 DELETE FROM public.video_screen_leases WHERE meeting_id=p_meeting_id AND expires_at<=now();
 DELETE FROM public.video_guest_screen_leases WHERE meeting_id=p_meeting_id AND expires_at<=now();
 IF EXISTS(SELECT 1 FROM public.video_screen_leases WHERE meeting_id=p_meeting_id AND member_id=v_member)
 OR (SELECT count(*) FROM public.video_screen_leases WHERE meeting_id=p_meeting_id)
  +(SELECT count(*) FROM public.video_guest_screen_leases WHERE meeting_id=p_meeting_id)>=2 THEN
  RAISE EXCEPTION 'Ya compartes pantalla o están ocupados ambos cupos.' USING ERRCODE='22023';
 END IF;
 INSERT INTO public.video_screen_leases(meeting_id,member_id,expires_at)
 VALUES(p_meeting_id,v_member,now()+interval '35 seconds') RETURNING lease_id INTO v_lease;
 RETURN v_lease;
END; $$;
REVOKE ALL ON FUNCTION public.video_screen_claim(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.video_screen_claim(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.video_guest_screen_claim(p_identity text,p_session_hash text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_meeting uuid; v_lease uuid;
BEGIN
 SELECT meeting_id INTO v_meeting FROM public.video_guest_entries
 WHERE identity=p_identity AND session_hash=p_session_hash;
 IF v_meeting IS NULL THEN RAISE EXCEPTION 'Sesión inválida.' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.video_meetings WHERE id=v_meeting FOR UPDATE;
 IF public.video_guest_session(p_identity,p_session_hash) IS NULL THEN
  RAISE EXCEPTION 'Enlace vencido o revocado.' USING ERRCODE='42501'; END IF;
 DELETE FROM public.video_guest_screen_leases WHERE meeting_id=v_meeting AND expires_at<=now();
 DELETE FROM public.video_screen_leases WHERE meeting_id=v_meeting AND expires_at<=now();
 IF EXISTS(SELECT 1 FROM public.video_guest_screen_leases WHERE meeting_id=v_meeting AND identity=p_identity)
 OR (SELECT count(*) FROM public.video_screen_leases WHERE meeting_id=v_meeting)
  +(SELECT count(*) FROM public.video_guest_screen_leases WHERE meeting_id=v_meeting)>=2 THEN
  RAISE EXCEPTION 'Ya compartes pantalla o están ocupados ambos cupos.' USING ERRCODE='22023';
 END IF;
 INSERT INTO public.video_guest_screen_leases(meeting_id,identity,expires_at)
 VALUES(v_meeting,p_identity,now()+interval '35 seconds') RETURNING lease_id INTO v_lease;
 RETURN v_lease;
END; $$;
REVOKE ALL ON FUNCTION public.video_guest_screen_claim(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.video_guest_screen_claim(text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.video_guest_screen_touch(p_identity text,p_session_hash text,p_lease_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF public.video_guest_session(p_identity,p_session_hash) IS NULL THEN RETURN false; END IF;
 UPDATE public.video_guest_screen_leases SET expires_at=now()+interval '35 seconds'
 WHERE identity=p_identity AND lease_id=p_lease_id AND expires_at>now();
 RETURN FOUND;
END; $$;
REVOKE ALL ON FUNCTION public.video_guest_screen_touch(text,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.video_guest_screen_touch(text,text,uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.video_guest_screen_release(p_identity text,p_session_hash text,p_lease_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 DELETE FROM public.video_guest_screen_leases
 WHERE identity=p_identity AND lease_id=p_lease_id
 AND EXISTS(SELECT 1 FROM public.video_guest_entries
            WHERE identity=p_identity AND session_hash=p_session_hash);
 RETURN FOUND;
END; $$;
REVOKE ALL ON FUNCTION public.video_guest_screen_release(text,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.video_guest_screen_release(text,text,uuid) TO service_role;

-- Deshacer solo la prohibición general anterior de transcribir con invitados.
-- La autorización individual de TODOS y el chequeo del agente siguen siendo obligatorios.

CREATE OR REPLACE FUNCTION public.video_transcription_begin(p_meeting_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_member text;
  v_meeting public.video_meetings%ROWTYPE;
  v_run uuid := gen_random_uuid();
  v_actual uuid;
BEGIN
  SELECT id INTO v_member FROM public.video_members
    WHERE auth_user_id = (SELECT auth.uid()) AND active;
  IF v_member IS NULL THEN
    RAISE EXCEPTION 'Solo un participante autenticado puede iniciar la transcripción.' USING ERRCODE='42501';
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



REVOKE ALL ON FUNCTION public.video_transcription_begin(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.video_transcription_confirm(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.video_transcription_write_segment(uuid,uuid,text,text,text,timestamptz,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.video_transcription_begin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.video_transcription_confirm(uuid,uuid,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.video_transcription_write_segment(uuid,uuid,text,text,text,timestamptz,timestamptz) TO service_role;

-- Revocar acceso externo detiene instantáneamente la autorización en la base.
CREATE OR REPLACE FUNCTION public.video_guest_link_revoke(p_meeting_id uuid,p_actor uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_meeting public.video_meetings%ROWTYPE; v_link public.video_guest_links%ROWTYPE;
BEGIN
 SELECT * INTO v_meeting FROM public.video_meetings WHERE id=p_meeting_id FOR UPDATE;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM public.video_members
   WHERE id=v_meeting.organizer_id AND auth_user_id=p_actor AND active AND role='admin') THEN
  RAISE EXCEPTION 'Solo el organizador puede revocar enlaces.' USING ERRCODE='42501'; END IF;
 UPDATE public.video_guest_links SET revoked_at=coalesce(revoked_at,now())
 WHERE meeting_id=p_meeting_id RETURNING * INTO v_link;
 IF NOT FOUND THEN RETURN jsonb_build_object('exists',false); END IF;
 UPDATE public.video_transcription_runs SET status='stopped',updated_at=now()
 WHERE meeting_id=p_meeting_id AND status<>'stopped';
 RETURN jsonb_build_object('exists',true,'id',v_link.id);
END; $$;
REVOKE ALL ON FUNCTION public.video_guest_link_revoke(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.video_guest_link_revoke(uuid,uuid) TO service_role;
COMMIT;
