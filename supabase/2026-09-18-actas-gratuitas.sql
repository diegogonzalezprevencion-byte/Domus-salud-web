-- DOMUS SALUD · ACTAS ESTRUCTURADAS SIN API NI IA DE PAGO
-- Requiere: tablas de reuniones, participantes, transcripciones y función video_is_meeting_participant.
-- No altera fichas clínicas, reuniones ni segmentos existentes.
-- Ejecutar completo en Supabase SQL Editor.
BEGIN;

CREATE TABLE IF NOT EXISTS public.video_meeting_minutes (
  meeting_id uuid PRIMARY KEY REFERENCES public.video_meetings(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved')),
  summary text NOT NULL DEFAULT '',
  topics text NOT NULL DEFAULT '',
  agreements text NOT NULL DEFAULT '',
  commitments text NOT NULL DEFAULT '',
  pending text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  source_segments integer NOT NULL DEFAULT 0 CHECK (source_segments >= 0),
  model text NOT NULL DEFAULT 'plantilla-local-sin-ia',
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  generated_by text REFERENCES public.video_members(id) ON DELETE SET NULL,
  edited_by text REFERENCES public.video_members(id) ON DELETE SET NULL,
  approved_by text REFERENCES public.video_members(id) ON DELETE SET NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  CONSTRAINT minutes_section_lengths CHECK (
    length(summary)<=12000 AND length(topics)<=12000 AND length(agreements)<=12000
    AND length(commitments)<=12000 AND length(pending)<=12000 AND length(notes)<=12000)
);

ALTER TABLE public.video_meeting_minutes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.video_meeting_minutes FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.video_meeting_minutes TO authenticated;
DROP POLICY IF EXISTS video_meeting_minutes_read ON public.video_meeting_minutes;
CREATE POLICY video_meeting_minutes_read ON public.video_meeting_minutes
  FOR SELECT TO authenticated USING (public.video_is_meeting_participant(meeting_id));

-- Identidad real del JWT, administrador activo E invitado a esta reunión.
CREATE OR REPLACE FUNCTION public.video_minutes_admin(p_meeting_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.video_members m
    JOIN public.video_meeting_participants p ON p.member_id=m.id
    WHERE p.meeting_id=p_meeting_id AND m.auth_user_id=(SELECT auth.uid())
      AND m.active AND m.role='admin');
$$;
REVOKE ALL ON FUNCTION public.video_minutes_admin(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.video_minutes_admin(uuid) TO authenticated;

-- Genera SOLO una plantilla vacía vinculada a una transcripción existente.
-- No procesa audio ni envía datos a terceros. Cuenta segmentos en la BD, no confía en el navegador.
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
  IF v_count=0 THEN
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
REVOKE ALL ON FUNCTION public.video_minutes_create_template(uuid,boolean,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.video_minutes_create_template(uuid,boolean,integer) TO authenticated;

-- Guarda secciones redactadas por administración; evita sobrescribir cambios concurrentes.
CREATE OR REPLACE FUNCTION public.video_minutes_save(
 p_meeting_id uuid,p_summary text,p_topics text,p_agreements text,
 p_commitments text,p_pending text,p_notes text,p_revision integer
)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_member text;v_new integer;
BEGIN
 IF NOT public.video_minutes_admin(p_meeting_id) THEN
   RAISE EXCEPTION 'Solo un administrador invitado puede editar.' USING ERRCODE='42501';
 END IF;
 IF p_revision IS NULL OR EXISTS(SELECT 1 FROM (VALUES(p_summary),(p_topics),(p_agreements),
   (p_commitments),(p_pending),(p_notes)) AS v(s) WHERE v.s IS NULL OR length(v.s)>12000) THEN
   RAISE EXCEPTION 'Campos del acta inválidos.' USING ERRCODE='22023';
 END IF;
 SELECT id INTO v_member FROM public.video_members WHERE auth_user_id=(SELECT auth.uid()) AND active;
 UPDATE public.video_meeting_minutes SET summary=p_summary,topics=p_topics,
   agreements=p_agreements,commitments=p_commitments,pending=p_pending,notes=p_notes,
   edited_by=v_member,revision=revision+1,updated_at=now()
 WHERE meeting_id=p_meeting_id AND status='draft' AND revision=p_revision
 RETURNING revision INTO v_new;
 IF v_new IS NULL THEN
   RAISE EXCEPTION 'El acta fue editada o aprobada por otro usuario. Recarga antes de guardar.' USING ERRCODE='40001';
 END IF;
 RETURN v_new;
END;
$$;
REVOKE ALL ON FUNCTION public.video_minutes_save(uuid,text,text,text,text,text,text,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.video_minutes_save(uuid,text,text,text,text,text,text,integer) TO authenticated;

-- Requiere resumen escrito y transcripción detenida. Acta aprobada queda bloqueada.
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
   AND length(btrim(summary))>0 AND source_segments>0
   AND NOT EXISTS(SELECT 1 FROM public.video_transcription_runs r
                  WHERE r.meeting_id=p_meeting_id AND r.status<>'stopped')
 RETURNING revision INTO v_new;
 RETURN v_new IS NOT NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.video_minutes_approve(uuid,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.video_minutes_approve(uuid,integer) TO authenticated;

-- Si una migración anterior de actas IA ya se ejecutó, impedir usos de sus funciones privilegiadas.
DO $$ BEGIN
  IF to_regprocedure('public.video_minutes_store_generated(uuid,text,jsonb,integer,text,boolean,integer)') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.video_minutes_store_generated(uuid,text,jsonb,integer,text,boolean,integer) FROM PUBLIC,anon,authenticated,service_role;
  END IF;
END $$;

COMMIT;
-- Comprobar: SELECT to_regclass('public.video_meeting_minutes'),to_regprocedure('public.video_minutes_create_template(uuid,boolean,integer)');
