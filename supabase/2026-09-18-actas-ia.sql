-- DOMUS SALUD · Actas con IA, migración incremental. Ejecutar una vez después de transcripciones.
-- No modifica tablas de pacientes, chat ni los segmentos existentes.
BEGIN;

CREATE TABLE IF NOT EXISTS public.video_minutes_consent (
  meeting_id uuid NOT NULL,
  member_id text NOT NULL,
  accepted boolean NOT NULL,
  decided_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (meeting_id, member_id),
  FOREIGN KEY (meeting_id, member_id)
    REFERENCES public.video_meeting_participants(meeting_id,member_id) ON DELETE CASCADE
);

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
  model text NOT NULL DEFAULT '',
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

CREATE INDEX IF NOT EXISTS video_minutes_consent_meeting_idx
  ON public.video_minutes_consent(meeting_id,accepted);

ALTER TABLE public.video_minutes_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_meeting_minutes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.video_minutes_consent, public.video_meeting_minutes FROM anon, authenticated;
GRANT SELECT ON public.video_minutes_consent, public.video_meeting_minutes TO authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.video_minutes_consent, public.video_meeting_minutes TO service_role;

DROP POLICY IF EXISTS video_minutes_consent_read ON public.video_minutes_consent;
CREATE POLICY video_minutes_consent_read ON public.video_minutes_consent
  FOR SELECT TO authenticated USING (public.video_is_meeting_participant(meeting_id));
DROP POLICY IF EXISTS video_meeting_minutes_read ON public.video_meeting_minutes;
CREATE POLICY video_meeting_minutes_read ON public.video_meeting_minutes
  FOR SELECT TO authenticated USING (public.video_is_meeting_participant(meeting_id));

-- Participación administrativa: identidad derivada del JWT, nunca del navegador.
CREATE OR REPLACE FUNCTION public.video_minutes_admin(p_meeting_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.video_members m
    JOIN public.video_meeting_participants p ON p.member_id=m.id
    WHERE p.meeting_id=p_meeting_id AND m.auth_user_id=(SELECT auth.uid())
      AND m.active AND m.role='admin');
$$;
REVOKE ALL ON FUNCTION public.video_minutes_admin(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.video_minutes_admin(uuid) TO authenticated;

-- El propio participante decide si permite enviar la transcripción a un modelo de IA.
CREATE OR REPLACE FUNCTION public.video_minutes_set_consent(p_meeting_id uuid,p_accepted boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_member text;
BEGIN
  IF p_accepted IS NULL THEN RAISE EXCEPTION 'Debes indicar aceptar o rechazar.' USING ERRCODE='22023'; END IF;
  SELECT m.id INTO v_member FROM public.video_members m
  JOIN public.video_meeting_participants p ON p.member_id=m.id
  JOIN public.video_meetings r ON r.id=p.meeting_id
  WHERE p.meeting_id=p_meeting_id AND r.status='scheduled'
    AND m.auth_user_id=(SELECT auth.uid()) AND m.active;
  IF v_member IS NULL THEN RAISE EXCEPTION 'No perteneces a esta reunión.' USING ERRCODE='42501'; END IF;
  INSERT INTO public.video_minutes_consent(meeting_id,member_id,accepted,decided_at)
  VALUES(p_meeting_id,v_member,p_accepted,now())
  ON CONFLICT (meeting_id,member_id) DO UPDATE SET accepted=EXCLUDED.accepted,decided_at=now();
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.video_minutes_set_consent(uuid,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.video_minutes_set_consent(uuid,boolean) TO authenticated;

-- Solo servicio; todos los invitados han aceptado explícitamente el procesamiento con IA.
CREATE OR REPLACE FUNCTION public.video_minutes_all_consented(p_meeting_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS(SELECT 1 FROM public.video_meetings WHERE id=p_meeting_id AND status='scheduled')
    AND EXISTS(SELECT 1 FROM public.video_meeting_participants WHERE meeting_id=p_meeting_id)
    AND NOT EXISTS (
      SELECT 1 FROM public.video_meeting_participants p
      LEFT JOIN public.video_minutes_consent c
        ON c.meeting_id=p.meeting_id AND c.member_id=p.member_id
      WHERE p.meeting_id=p_meeting_id AND COALESCE(c.accepted,false)=false
    );
$$;
REVOKE ALL ON FUNCTION public.video_minutes_all_consented(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.video_minutes_all_consented(uuid) TO service_role;

-- Guardado transaccional del borrador IA, sólo por el backend con service_role.
-- Impide sobrescribir un acta aprobada y revalida consentimiento y fin de transcripción.
CREATE OR REPLACE FUNCTION public.video_minutes_store_generated(
  p_meeting_id uuid,p_member_id text,p_sections jsonb,p_segment_count integer,
  p_model text,p_replace_draft boolean DEFAULT false,p_expected_revision integer DEFAULT NULL
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_status text; v_old text; v_role text; v_old_revision integer;
BEGIN
  SELECT status INTO v_status FROM public.video_meetings WHERE id=p_meeting_id FOR UPDATE;
  IF v_status IS DISTINCT FROM 'scheduled' THEN RETURN false; END IF;
  SELECT m.role INTO v_role FROM public.video_members m
    JOIN public.video_meeting_participants p ON p.member_id=m.id
    WHERE p.meeting_id=p_meeting_id AND m.id=p_member_id AND m.active;
  IF v_role IS DISTINCT FROM 'admin' OR NOT public.video_minutes_all_consented(p_meeting_id)
    OR p_segment_count IS NULL OR p_segment_count<1
    OR EXISTS(SELECT 1 FROM public.video_transcription_runs r
              WHERE r.meeting_id=p_meeting_id AND r.status <> 'stopped')
  THEN RETURN false; END IF;
  IF p_sections IS NULL OR jsonb_typeof(p_sections)<>'object' THEN RETURN false; END IF;
  IF EXISTS(SELECT 1 FROM (VALUES('summary'),('topics'),('agreements'),('commitments'),('pending'),('notes')) AS k(name)
            WHERE jsonb_typeof(p_sections->k.name) IS DISTINCT FROM 'string'
               OR length(p_sections->>k.name)>12000) THEN RETURN false; END IF;
  SELECT status,revision INTO v_old,v_old_revision FROM public.video_meeting_minutes WHERE meeting_id=p_meeting_id FOR UPDATE;
  IF v_old='approved' OR (v_old='draft' AND (NOT COALESCE(p_replace_draft,false)
      OR v_old_revision IS DISTINCT FROM p_expected_revision)) THEN RETURN false; END IF;
  INSERT INTO public.video_meeting_minutes(
    meeting_id,status,summary,topics,agreements,commitments,pending,notes,
    source_segments,model,generated_by,edited_by,generated_at,updated_at,revision
  ) VALUES(
    p_meeting_id,'draft',p_sections->>'summary',p_sections->>'topics',
    p_sections->>'agreements',p_sections->>'commitments',p_sections->>'pending',
    p_sections->>'notes',p_segment_count,left(p_model,120),p_member_id,p_member_id,now(),now(),1
  ) ON CONFLICT (meeting_id) DO UPDATE SET
    status='draft',summary=EXCLUDED.summary,topics=EXCLUDED.topics,
    agreements=EXCLUDED.agreements,commitments=EXCLUDED.commitments,
    pending=EXCLUDED.pending,notes=EXCLUDED.notes,
    source_segments=EXCLUDED.source_segments,model=EXCLUDED.model,
    generated_by=EXCLUDED.generated_by,edited_by=EXCLUDED.edited_by,
    approved_by=NULL,approved_at=NULL,generated_at=now(),updated_at=now(),
    revision=public.video_meeting_minutes.revision+1
    WHERE public.video_meeting_minutes.status='draft';
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.video_minutes_store_generated(uuid,text,jsonb,integer,text,boolean,integer)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.video_minutes_store_generated(uuid,text,jsonb,integer,text,boolean,integer) TO service_role;

-- Edición con revisión optimista: evita pisar cambios de otro administrador.
CREATE OR REPLACE FUNCTION public.video_minutes_save(
 p_meeting_id uuid,p_summary text,p_topics text,p_agreements text,
 p_commitments text,p_pending text,p_notes text,p_revision integer
)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_member text; v_new integer;
BEGIN
  IF NOT public.video_minutes_admin(p_meeting_id) THEN
    RAISE EXCEPTION 'Solo un administrador invitado puede editar.' USING ERRCODE='42501';
  END IF;
  IF p_revision IS NULL OR EXISTS(SELECT 1 FROM (VALUES(p_summary),(p_topics),(p_agreements),
      (p_commitments),(p_pending),(p_notes)) AS v(s) WHERE v.s IS NULL OR length(v.s)>12000) THEN
    RAISE EXCEPTION 'Datos de acta inválidos.' USING ERRCODE='22023';
  END IF;
  SELECT id INTO v_member FROM public.video_members WHERE auth_user_id=(SELECT auth.uid()) AND active;
  UPDATE public.video_meeting_minutes SET summary=p_summary,topics=p_topics,
    agreements=p_agreements,commitments=p_commitments,pending=p_pending,notes=p_notes,
    edited_by=v_member,revision=revision+1,updated_at=now()
    WHERE meeting_id=p_meeting_id AND status='draft' AND revision=p_revision
    RETURNING revision INTO v_new;
  IF v_new IS NULL THEN
    RAISE EXCEPTION 'El acta fue modificada o aprobada por otra persona. Recarga antes de guardar.' USING ERRCODE='40001';
  END IF;
  RETURN v_new;
END;
$$;
REVOKE ALL ON FUNCTION public.video_minutes_save(uuid,text,text,text,text,text,text,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.video_minutes_save(uuid,text,text,text,text,text,text,integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.video_minutes_approve(p_meeting_id uuid,p_revision integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_member text;
BEGIN
  IF NOT public.video_minutes_admin(p_meeting_id) THEN
    RAISE EXCEPTION 'Solo un administrador invitado puede aprobar.' USING ERRCODE='42501';
  END IF;
  SELECT id INTO v_member FROM public.video_members WHERE auth_user_id=(SELECT auth.uid()) AND active;
  UPDATE public.video_meeting_minutes SET status='approved',approved_at=now(),
    approved_by=v_member,updated_at=now(),revision=revision+1
    WHERE meeting_id=p_meeting_id AND status='draft' AND revision=p_revision
      AND length(btrim(summary))>0 AND source_segments>0
      AND public.video_minutes_all_consented(p_meeting_id);
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.video_minutes_approve(uuid,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.video_minutes_approve(uuid,integer) TO authenticated;

COMMIT;
-- Verificación: SELECT to_regclass('public.video_meeting_minutes'),to_regclass('public.video_minutes_consent');
