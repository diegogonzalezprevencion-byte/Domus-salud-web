-- DOMUS SALUD · FASE 5.1 · Reuniones editables, deduplicación, enlace externo persistente y acta colaborativa.
-- Reemplaza el SQL anterior de Fase 5. Si ya lo ejecutaste, también revierte el punto del calendario privado y agrega edición de reuniones.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- 1) RESTAURAR CALENDARIO COMPARTIDO DE ADMINISTRACIÓN
--    + HABILITAR EDICIÓN DE REUNIONES
-- =====================================================
-- Esta versión reemplaza el punto anterior de calendario privado.
-- Los administradores mantienen la vista compartida previa; los demás usuarios
-- solo pueden leer reuniones en las que participan.

CREATE OR REPLACE FUNCTION public.video_is_meeting_participant(p_meeting_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.video_members m
    JOIN public.video_meeting_participants p ON p.member_id=m.id
    WHERE m.auth_user_id=(SELECT auth.uid())
      AND m.active
      AND p.meeting_id=p_meeting_id
  );
$$;

CREATE OR REPLACE FUNCTION public.video_can_read_meeting(p_meeting_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.video_members m
    WHERE m.auth_user_id=(SELECT auth.uid())
      AND m.active
      AND (
        m.role='admin'
        OR EXISTS (
          SELECT 1
          FROM public.video_meeting_participants p
          WHERE p.meeting_id=p_meeting_id
            AND p.member_id=m.id
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.video_is_meeting_participant(uuid)
FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.video_can_read_meeting(uuid)
FROM PUBLIC,anon,authenticated;

GRANT EXECUTE ON FUNCTION public.video_is_meeting_participant(uuid)
TO authenticated;
GRANT EXECUTE ON FUNCTION public.video_can_read_meeting(uuid)
TO authenticated;

DROP POLICY IF EXISTS video_meetings_read ON public.video_meetings;
CREATE POLICY video_meetings_read
ON public.video_meetings
FOR SELECT
TO authenticated
USING (public.video_can_read_meeting(id));

DROP POLICY IF EXISTS video_participants_read ON public.video_meeting_participants;
CREATE POLICY video_participants_read
ON public.video_meeting_participants
FOR SELECT
TO authenticated
USING (public.video_can_read_meeting(meeting_id));

-- Editar una reunión futura.
-- Solo el administrador que la organizó puede modificarla.
-- Permite cambiar título, descripción, fecha, hora, duración y participantes.
-- Al guardar, deja invitaciones pendientes nuevamente para reenviar los datos actualizados.
CREATE OR REPLACE FUNCTION public.video_update_meeting(
  p_meeting_id uuid,
  p_title text,
  p_description text,
  p_starts_at timestamptz,
  p_duration_minutes integer,
  p_participant_ids text[],
  p_timezone text DEFAULT 'America/Santiago'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_organizer text;
  v_meeting public.video_meetings%ROWTYPE;
  v_requested text[];
  v_all text[];
BEGIN
  SELECT m.id
  INTO v_organizer
  FROM public.video_members m
  WHERE m.auth_user_id=(SELECT auth.uid())
    AND m.active
    AND m.role='admin';

  IF v_organizer IS NULL THEN
    RAISE EXCEPTION 'Acceso denegado.'
      USING ERRCODE='42501';
  END IF;

  SELECT *
  INTO v_meeting
  FROM public.video_meetings
  WHERE id=p_meeting_id
  FOR UPDATE;

  IF NOT FOUND
     OR v_meeting.status<>'scheduled'
     OR v_meeting.organizer_id<>v_organizer
  THEN
    RAISE EXCEPTION 'Solo el organizador puede editar una reunión activa.'
      USING ERRCODE='42501';
  END IF;

  IF v_meeting.starts_at<=now()+interval '15 minutes' THEN
    RAISE EXCEPTION 'La reunión está dentro de la ventana de ingreso y ya no puede editarse.'
      USING ERRCODE='22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.video_transcription_runs r
    WHERE r.meeting_id=p_meeting_id
      AND r.status<>'stopped'
  ) THEN
    RAISE EXCEPTION 'Detén primero la transcripción.'
      USING ERRCODE='22023';
  END IF;

  IF p_title IS NULL
     OR length(btrim(p_title)) NOT BETWEEN 1 AND 120
     OR length(coalesce(p_description,''))>1500
     OR p_starts_at IS NULL
     OR p_starts_at<=now()+interval '15 minutes'
     OR p_duration_minutes NOT IN (15,30,45,60,90,120)
     OR p_timezone IS NULL
     OR NOT EXISTS (
       SELECT 1
       FROM pg_catalog.pg_timezone_names z
       WHERE z.name=p_timezone
     )
  THEN
    RAISE EXCEPTION 'Revisa título, fecha futura, hora, duración y zona horaria.'
      USING ERRCODE='22023';
  END IF;

  SELECT coalesce(array_agg(DISTINCT x),ARRAY[]::text[])
  INTO v_requested
  FROM unnest(coalesce(p_participant_ids,ARRAY[]::text[])) AS u(x)
  WHERE x IS NOT NULL
    AND x<>v_organizer;

  IF cardinality(v_requested)>100
     OR EXISTS (
       SELECT 1
       FROM unnest(v_requested) AS requested(id)
       LEFT JOIN public.video_members m
         ON m.id=requested.id
        AND m.active
       WHERE m.id IS NULL
     )
  THEN
    RAISE EXCEPTION 'La lista contiene participantes inexistentes/inactivos o supera el límite permitido.'
      USING ERRCODE='22023';
  END IF;

  v_all := array_prepend(v_organizer,v_requested);

  -- Si existían consentimientos previos de alguien que se retira, se eliminan
  -- antes de retirar su vínculo de participante.
  DELETE FROM public.video_transcription_consent c
  WHERE c.meeting_id=p_meeting_id
    AND NOT (c.member_id=ANY(v_all));

  IF to_regclass('public.video_minutes_consent') IS NOT NULL THEN
    EXECUTE
      'DELETE FROM public.video_minutes_consent
       WHERE meeting_id=$1
         AND NOT (member_id=ANY($2))'
    USING p_meeting_id,v_all;
  END IF;

  DELETE FROM public.video_meeting_participants p
  WHERE p.meeting_id=p_meeting_id
    AND NOT (p.member_id=ANY(v_all));

  INSERT INTO public.video_meeting_participants(
    meeting_id,
    member_id,
    participation_status,
    email_status
  )
  SELECT
    p_meeting_id,
    m.id,
    CASE WHEN m.id=v_organizer THEN 'organizer' ELSE 'invited' END,
    CASE WHEN m.email IS NULL THEN 'missing_email' ELSE 'pending' END
  FROM public.video_members m
  WHERE m.id=ANY(v_all)
  ON CONFLICT(meeting_id,member_id)
  DO UPDATE SET
    participation_status=EXCLUDED.participation_status,
    email_status=EXCLUDED.email_status;

  UPDATE public.video_meetings
  SET
    title=btrim(p_title),
    description=coalesce(btrim(p_description),''),
    starts_at=p_starts_at,
    timezone=p_timezone,
    duration_minutes=p_duration_minutes,
    updated_at=now()
  WHERE id=p_meeting_id;

  -- Retirar correos de personas quitadas de la reunión.
  DELETE FROM public.video_email_outbox o
  WHERE o.meeting_id=p_meeting_id
    AND o.event_type='invitation'
    AND NOT (o.member_id=ANY(v_all));

  -- Si alguien permanece pero perdió su correo, no debe conservar una salida antigua.
  DELETE FROM public.video_email_outbox o
  USING public.video_members m
  WHERE o.meeting_id=p_meeting_id
    AND o.event_type='invitation'
    AND o.member_id=m.id
    AND m.id=ANY(v_all)
    AND m.email IS NULL;

  -- Todos los participantes vigentes con correo reciben la invitación actualizada.
  INSERT INTO public.video_email_outbox(
    meeting_id,
    member_id,
    recipient_email,
    event_type,
    status,
    attempts,
    last_error,
    created_at,
    sent_at,
    claimed_at
  )
  SELECT
    p_meeting_id,
    m.id,
    m.email,
    'invitation',
    'pending',
    0,
    NULL,
    now(),
    NULL,
    NULL
  FROM public.video_members m
  WHERE m.id=ANY(v_all)
    AND m.email IS NOT NULL
  ON CONFLICT(meeting_id,member_id,event_type)
  DO UPDATE SET
    recipient_email=EXCLUDED.recipient_email,
    status='pending',
    attempts=0,
    last_error=NULL,
    created_at=now(),
    sent_at=NULL,
    claimed_at=NULL;

  -- Si ya existe enlace externo, conserva el mismo enlace y actualiza su vigencia
  -- al nuevo horario de la reunión.
  UPDATE public.video_guest_links
  SET expires_at=p_starts_at+(p_duration_minutes+15)*interval '1 minute'
  WHERE meeting_id=p_meeting_id
    AND revoked_at IS NULL;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.video_update_meeting(
  uuid,text,text,timestamptz,integer,text[],text
)
FROM PUBLIC,anon,authenticated;

GRANT EXECUTE ON FUNCTION public.video_update_meeting(
  uuid,text,text,timestamptz,integer,text[],text
)
TO authenticated;

-- =====================================================
-- 2) CORRECCIÓN DE ADMINISTRADORES/PROFESIONALES DUPLICADOS
-- =====================================================
-- Caso seguro a corregir automáticamente:
--   * registro admin activo y vinculado a Supabase Auth;
--   * registro profesional activo SIN Auth;
--   * mismo correo, o mismo nombre normalizado.
-- El registro secundario NO se elimina: queda inactivo para preservar referencias históricas.
CREATE TEMP TABLE _domus_member_merge ON COMMIT DROP AS
SELECT d.id AS old_id, c.id AS new_id
FROM public.video_members d
JOIN LATERAL (
  SELECT x.id
  FROM public.video_members x
  WHERE x.id<>d.id
    AND x.active
    AND x.auth_user_id IS NOT NULL
    AND x.role='admin'
    AND x.id LIKE 'admin:%'
    AND (
      (d.email IS NOT NULL AND x.email IS NOT NULL AND lower(btrim(d.email))=lower(btrim(x.email)))
      OR lower(regexp_replace(btrim(d.display_name),'\\s+',' ','g'))
         = lower(regexp_replace(btrim(x.display_name),'\\s+',' ','g'))
    )
  ORDER BY
    CASE WHEN d.email IS NOT NULL AND x.email IS NOT NULL
              AND lower(btrim(d.email))=lower(btrim(x.email)) THEN 0 ELSE 1 END,
    x.created_at
  LIMIT 1
) c ON true
WHERE d.active
  AND d.auth_user_id IS NULL
  AND d.role='professional'
  AND d.id LIKE 'professional:%';

-- Si el perfil duplicado estaba en reuniones, incorporar el perfil canónico sin duplicar filas.
INSERT INTO public.video_meeting_participants(
  meeting_id,member_id,participation_status,email_status,added_at
)
SELECT p.meeting_id,m.new_id,
       CASE WHEN r.organizer_id=m.new_id OR p.participation_status='organizer' THEN 'organizer'
            ELSE p.participation_status END,
       p.email_status,p.added_at
FROM public.video_meeting_participants p
JOIN _domus_member_merge m ON m.old_id=p.member_id
JOIN public.video_meetings r ON r.id=p.meeting_id
ON CONFLICT(meeting_id,member_id) DO NOTHING;

DELETE FROM public.video_meeting_participants p
USING _domus_member_merge m
WHERE p.member_id=m.old_id;

-- Trasladar correos pendientes/sent a la identidad canónica y retirar la copia vieja.
INSERT INTO public.video_email_outbox(
  meeting_id,member_id,recipient_email,event_type,status,attempts,last_error,created_at,sent_at
)
SELECT o.meeting_id,m.new_id,
       COALESCE(c.email,o.recipient_email),o.event_type,o.status,o.attempts,o.last_error,o.created_at,o.sent_at
FROM public.video_email_outbox o
JOIN _domus_member_merge m ON m.old_id=o.member_id
JOIN public.video_members c ON c.id=m.new_id
WHERE COALESCE(c.email,o.recipient_email) IS NOT NULL
ON CONFLICT(meeting_id,member_id,event_type) DO NOTHING;

DELETE FROM public.video_email_outbox o
USING _domus_member_merge m
WHERE o.member_id=m.old_id;

-- Los cupos de pantalla son efímeros; liberar cualquier cupo del registro duplicado.
DELETE FROM public.video_screen_leases s
USING _domus_member_merge m
WHERE s.member_id=m.old_id;

-- Ocultar el perfil duplicado de todos los selectores futuros, conservándolo como referencia histórica.
UPDATE public.video_members d
SET active=false,updated_at=now()
FROM _domus_member_merge m
WHERE d.id=m.old_id;

-- =====================================================
-- 3) ENLACE EXTERNO RECUPERABLE EN EL RESUMEN DE LA REUNIÓN
-- =====================================================
-- El token sigue protegido por RLS/service_role. Se guarda para que el organizador
-- pueda volver a copiar el MISMO enlace desde el detalle de la reunión.
ALTER TABLE public.video_guest_links
  ADD COLUMN IF NOT EXISTS token_secret text;

ALTER TABLE public.video_guest_links
  DROP CONSTRAINT IF EXISTS video_guest_links_token_secret_check;
ALTER TABLE public.video_guest_links
  ADD CONSTRAINT video_guest_links_token_secret_check
  CHECK (token_secret IS NULL OR token_secret ~ '^[0-9a-f]{64}$');

CREATE OR REPLACE FUNCTION public.video_guest_link_status(
  p_meeting_id uuid,
  p_actor uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_link public.video_guest_links%ROWTYPE;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.video_meetings r
    JOIN public.video_members m ON m.id=r.organizer_id
    WHERE r.id=p_meeting_id
      AND m.auth_user_id=p_actor
      AND m.active
      AND m.role='admin'
  ) THEN
    RAISE EXCEPTION 'Solo el organizador puede gestionar el enlace.' USING ERRCODE='42501';
  END IF;

  SELECT * INTO v_link
  FROM public.video_guest_links
  WHERE meeting_id=p_meeting_id;

  IF NOT FOUND THEN RETURN jsonb_build_object('exists',false); END IF;

  RETURN jsonb_build_object(
    'exists',true,
    'id',v_link.id,
    'revoked',v_link.revoked_at IS NOT NULL,
    'expiresAt',v_link.expires_at,
    'tokenSecret',v_link.token_secret
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.video_guest_link_create(
  p_meeting_id uuid,
  p_actor uuid,
  p_token_hash text,
  p_token_secret text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_meeting public.video_meetings%ROWTYPE;
  v_existing public.video_guest_links%ROWTYPE;
  v_id uuid := gen_random_uuid();
  v_expiry timestamptz;
BEGIN
  IF p_token_hash IS NULL OR p_token_hash !~ '^[0-9a-f]{64}$'
     OR p_token_secret IS NULL OR p_token_secret !~ '^[0-9a-f]{64}$'
     OR encode(extensions.digest(p_token_secret,'sha256'),'hex')<>lower(p_token_hash)
  THEN
    RAISE EXCEPTION 'Código de enlace inválido.' USING ERRCODE='22023';
  END IF;

  SELECT * INTO v_meeting
  FROM public.video_meetings
  WHERE id=p_meeting_id
  FOR UPDATE;

  IF NOT FOUND OR v_meeting.status<>'scheduled'
     OR now()>=v_meeting.starts_at+(v_meeting.duration_minutes+15)*interval '1 minute'
  THEN
    RAISE EXCEPTION 'La reunión no está disponible.' USING ERRCODE='22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.video_members
    WHERE id=v_meeting.organizer_id
      AND auth_user_id=p_actor
      AND active AND role='admin'
  ) THEN
    RAISE EXCEPTION 'Solo el organizador puede crear el enlace.' USING ERRCODE='42501';
  END IF;

  SELECT * INTO v_existing
  FROM public.video_guest_links
  WHERE meeting_id=p_meeting_id
  FOR UPDATE;

  IF FOUND AND v_existing.revoked_at IS NULL AND v_existing.expires_at>now() THEN
    RAISE EXCEPTION 'Ya existe un enlace activo.' USING ERRCODE='22023';
  END IF;

  v_expiry:=v_meeting.starts_at+(v_meeting.duration_minutes+15)*interval '1 minute';

  INSERT INTO public.video_guest_links(
    meeting_id,id,token_hash,token_secret,expires_at,created_at,revoked_at
  ) VALUES(
    p_meeting_id,v_id,lower(p_token_hash),lower(p_token_secret),v_expiry,now(),NULL
  )
  ON CONFLICT(meeting_id) DO UPDATE SET
    id=EXCLUDED.id,
    token_hash=EXCLUDED.token_hash,
    token_secret=EXCLUDED.token_secret,
    expires_at=EXCLUDED.expires_at,
    created_at=now(),
    revoked_at=NULL;

  RETURN jsonb_build_object('id',v_id,'expiresAt',v_expiry);
END;
$$;

-- Desactivar la firma antigua para que las nuevas invitaciones siempre sean recuperables.
DO $$ BEGIN
  IF to_regprocedure('public.video_guest_link_create(uuid,uuid,text)') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.video_guest_link_create(uuid,uuid,text)
      FROM PUBLIC,anon,authenticated,service_role;
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.video_guest_link_status(uuid,uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.video_guest_link_create(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.video_guest_link_status(uuid,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.video_guest_link_create(uuid,uuid,text,text) TO service_role;

-- =====================================================
-- 4) ACTA COLABORATIVA: CUALQUIER PARTICIPANTE PUEDE REDACTAR Y GUARDAR
-- =====================================================
CREATE OR REPLACE FUNCTION public.video_minutes_editor(p_meeting_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.video_members m
    JOIN public.video_meeting_participants p ON p.member_id=m.id
    WHERE p.meeting_id=p_meeting_id
      AND m.auth_user_id=(SELECT auth.uid())
      AND m.active
  );
$$;
REVOKE ALL ON FUNCTION public.video_minutes_editor(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.video_minutes_editor(uuid) TO authenticated;

-- Crear el borrador incluso durante la reunión. No exige transcripción activa/detenida.
CREATE OR REPLACE FUNCTION public.video_minutes_create_template(
  p_meeting_id uuid,
  p_replace_draft boolean DEFAULT false,
  p_expected_revision integer DEFAULT NULL
)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_member text;
  v_status text;
  v_count integer;
  v_revision integer;
  v_existing public.video_meeting_minutes%ROWTYPE;
BEGIN
  IF NOT public.video_minutes_editor(p_meeting_id) THEN
    RAISE EXCEPTION 'Solo un participante de la reunión puede redactar el acta.' USING ERRCODE='42501';
  END IF;

  SELECT status INTO v_status
  FROM public.video_meetings
  WHERE id=p_meeting_id
  FOR UPDATE;
  IF v_status IS DISTINCT FROM 'scheduled' THEN
    RAISE EXCEPTION 'La reunión no está disponible.' USING ERRCODE='22023';
  END IF;

  SELECT id INTO v_member
  FROM public.video_members
  WHERE auth_user_id=(SELECT auth.uid()) AND active
  LIMIT 1;

  SELECT count(*) INTO v_count
  FROM public.video_transcript_segments
  WHERE meeting_id=p_meeting_id;

  SELECT * INTO v_existing
  FROM public.video_meeting_minutes
  WHERE meeting_id=p_meeting_id
  FOR UPDATE;

  IF FOUND THEN
    IF v_existing.status='approved' THEN
      RETURN v_existing.revision;
    END IF;
    IF NOT COALESCE(p_replace_draft,false) THEN
      RETURN v_existing.revision;
    END IF;
    IF p_expected_revision IS DISTINCT FROM v_existing.revision THEN
      RAISE EXCEPTION 'El borrador cambió. Recarga el acta antes de reemplazarlo.' USING ERRCODE='40001';
    END IF;
    UPDATE public.video_meeting_minutes SET
      status='draft',summary='',topics='',agreements='',commitments='',pending='',notes='',
      source_segments=v_count,model='plantilla-local-sin-ia',generated_by=v_member,edited_by=v_member,
      approved_by=NULL,approved_at=NULL,generated_at=now(),updated_at=now(),revision=revision+1
    WHERE meeting_id=p_meeting_id
    RETURNING revision INTO v_revision;
  ELSE
    INSERT INTO public.video_meeting_minutes(
      meeting_id,status,source_segments,model,generated_by,edited_by
    ) VALUES(
      p_meeting_id,'draft',v_count,'plantilla-local-sin-ia',v_member,v_member
    ) RETURNING revision INTO v_revision;
  END IF;
  RETURN v_revision;
END;
$$;

CREATE OR REPLACE FUNCTION public.video_minutes_save(
  p_meeting_id uuid,p_summary text,p_topics text,p_agreements text,
  p_commitments text,p_pending text,p_notes text,p_revision integer
)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_member text;v_new integer;v_count integer;
BEGIN
  IF NOT public.video_minutes_editor(p_meeting_id) THEN
    RAISE EXCEPTION 'Solo un participante de la reunión puede editar el acta.' USING ERRCODE='42501';
  END IF;
  IF p_revision IS NULL OR EXISTS(
    SELECT 1 FROM (VALUES(p_summary),(p_topics),(p_agreements),(p_commitments),(p_pending),(p_notes)) AS v(s)
    WHERE v.s IS NULL OR length(v.s)>12000
  ) THEN
    RAISE EXCEPTION 'Campos del acta inválidos.' USING ERRCODE='22023';
  END IF;
  SELECT id INTO v_member FROM public.video_members
  WHERE auth_user_id=(SELECT auth.uid()) AND active LIMIT 1;
  SELECT count(*) INTO v_count FROM public.video_transcript_segments WHERE meeting_id=p_meeting_id;
  UPDATE public.video_meeting_minutes SET
    summary=p_summary,topics=p_topics,agreements=p_agreements,commitments=p_commitments,
    pending=p_pending,notes=p_notes,edited_by=v_member,source_segments=v_count,
    revision=revision+1,updated_at=now()
  WHERE meeting_id=p_meeting_id AND status='draft' AND revision=p_revision
  RETURNING revision INTO v_new;
  IF v_new IS NULL THEN
    RAISE EXCEPTION 'El acta fue modificada por otra persona. Actualiza el panel antes de volver a guardar.' USING ERRCODE='40001';
  END IF;
  RETURN v_new;
END;
$$;

-- La aprobación sigue reservada a administración participante; la redacción es colaborativa.
CREATE OR REPLACE FUNCTION public.video_minutes_approve(p_meeting_id uuid,p_revision integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_member text;v_new integer;v_count integer;
BEGIN
  IF NOT public.video_minutes_admin(p_meeting_id) THEN
    RAISE EXCEPTION 'Solo un administrador participante puede aprobar el acta.' USING ERRCODE='42501';
  END IF;
  SELECT id INTO v_member FROM public.video_members
  WHERE auth_user_id=(SELECT auth.uid()) AND active LIMIT 1;
  SELECT count(*) INTO v_count FROM public.video_transcript_segments WHERE meeting_id=p_meeting_id;
  UPDATE public.video_meeting_minutes SET
    status='approved',approved_at=now(),approved_by=v_member,updated_at=now(),
    source_segments=v_count,revision=revision+1
  WHERE meeting_id=p_meeting_id AND status='draft' AND revision=p_revision
    AND length(btrim(summary))>0
    AND NOT EXISTS(
      SELECT 1 FROM public.video_transcription_runs r
      WHERE r.meeting_id=p_meeting_id AND r.status<>'stopped'
    )
  RETURNING revision INTO v_new;
  RETURN v_new IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.video_minutes_create_template(uuid,boolean,integer) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.video_minutes_save(uuid,text,text,text,text,text,text,integer) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.video_minutes_approve(uuid,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.video_minutes_create_template(uuid,boolean,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.video_minutes_save(uuid,text,text,text,text,text,text,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.video_minutes_approve(uuid,integer) TO authenticated;

-- Invitados externos: misma capacidad de redactar/guardar, validando su secreto de sesión.
CREATE OR REPLACE FUNCTION public.video_guest_minutes_open(
  p_identity text,p_session_hash text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_meeting uuid;
  v_count integer;
  v_row public.video_meeting_minutes%ROWTYPE;
BEGIN
  SELECT e.meeting_id INTO v_meeting
  FROM public.video_guest_entries e
  WHERE e.identity=p_identity AND e.session_hash=p_session_hash;
  IF v_meeting IS NULL OR public.video_guest_session(p_identity,p_session_hash) IS NULL THEN
    RETURN NULL;
  END IF;

  PERFORM 1 FROM public.video_meetings WHERE id=v_meeting AND status='scheduled' FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT count(*) INTO v_count FROM public.video_transcript_segments WHERE meeting_id=v_meeting;
  SELECT * INTO v_row FROM public.video_meeting_minutes WHERE meeting_id=v_meeting FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.video_meeting_minutes(
      meeting_id,status,source_segments,model,generated_by,edited_by
    ) VALUES(
      v_meeting,'draft',v_count,'plantilla-local-sin-ia',p_identity,p_identity
    ) RETURNING * INTO v_row;
  END IF;

  RETURN jsonb_build_object(
    'meetingId',v_row.meeting_id,'status',v_row.status,'revision',v_row.revision,
    'summary',v_row.summary,'topics',v_row.topics,'agreements',v_row.agreements,
    'commitments',v_row.commitments,'pending',v_row.pending,'notes',v_row.notes,
    'sourceSegments',v_row.source_segments,'updatedAt',v_row.updated_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.video_guest_minutes_save(
  p_identity text,p_session_hash text,p_revision integer,
  p_summary text,p_topics text,p_agreements text,p_commitments text,p_pending text,p_notes text
)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_meeting uuid;v_new integer;v_count integer;
BEGIN
  SELECT e.meeting_id INTO v_meeting
  FROM public.video_guest_entries e
  WHERE e.identity=p_identity AND e.session_hash=p_session_hash;
  IF v_meeting IS NULL OR public.video_guest_session(p_identity,p_session_hash) IS NULL THEN
    RAISE EXCEPTION 'La sesión externa expiró.' USING ERRCODE='42501';
  END IF;
  IF p_revision IS NULL OR EXISTS(
    SELECT 1 FROM (VALUES(p_summary),(p_topics),(p_agreements),(p_commitments),(p_pending),(p_notes)) AS v(s)
    WHERE v.s IS NULL OR length(v.s)>12000
  ) THEN
    RAISE EXCEPTION 'Campos del acta inválidos.' USING ERRCODE='22023';
  END IF;
  PERFORM 1 FROM public.video_meetings WHERE id=v_meeting AND status='scheduled' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'La reunión no está disponible.' USING ERRCODE='22023'; END IF;
  SELECT count(*) INTO v_count FROM public.video_transcript_segments WHERE meeting_id=v_meeting;
  UPDATE public.video_meeting_minutes SET
    summary=p_summary,topics=p_topics,agreements=p_agreements,commitments=p_commitments,
    pending=p_pending,notes=p_notes,edited_by=p_identity,source_segments=v_count,
    revision=revision+1,updated_at=now()
  WHERE meeting_id=v_meeting AND status='draft' AND revision=p_revision
  RETURNING revision INTO v_new;
  IF v_new IS NULL THEN
    RAISE EXCEPTION 'Otra persona modificó el acta. Actualiza antes de guardar.' USING ERRCODE='40001';
  END IF;
  RETURN v_new;
END;
$$;

REVOKE ALL ON FUNCTION public.video_guest_minutes_open(text,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.video_guest_minutes_save(text,text,integer,text,text,text,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.video_guest_minutes_open(text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.video_guest_minutes_save(text,text,integer,text,text,text,text,text,text) TO service_role;

COMMIT;
