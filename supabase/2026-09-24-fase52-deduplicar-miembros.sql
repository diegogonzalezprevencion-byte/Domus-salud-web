-- DOMUS SALUD · FASE 5.2 · Corrección definitiva de administradores duplicados
-- Ejecutar DESPUÉS de Fase 5.1.
-- No elimina historiales clínicos ni transcripciones. Desactiva únicamente el perfil
-- profesional duplicado cuando existe un administrador activo con el mismo nombre
-- y el perfil profesional no tiene correo o comparte el mismo correo.
BEGIN;

CREATE TEMP TABLE _domus_member_merge ON COMMIT DROP AS
WITH candidates AS (
  SELECT
    p.id AS old_id,
    a.id AS new_id,
    row_number() OVER (
      PARTITION BY p.id
      ORDER BY
        (a.auth_user_id IS NOT NULL) DESC,
        (a.email IS NOT NULL) DESC,
        a.created_at ASC,
        a.id ASC
    ) AS rn
  FROM public.video_members p
  JOIN public.video_members a
    ON a.id <> p.id
   AND a.active
   AND a.role = 'admin'
   AND translate(
         lower(regexp_replace(btrim(a.display_name), '\s+', ' ', 'g')),
         'áéíóúüñ', 'aeiouun'
       ) = translate(
         lower(regexp_replace(btrim(p.display_name), '\s+', ' ', 'g')),
         'áéíóúüñ', 'aeiouun'
       )
   AND (
        p.email IS NULL
        OR a.email IS NULL
        OR lower(btrim(p.email)) = lower(btrim(a.email))
   )
  WHERE p.active
    AND p.role = 'professional'
    AND p.auth_user_id IS NULL
    AND p.id NOT LIKE 'guest:%'
)
SELECT old_id,new_id
FROM candidates
WHERE rn=1;

-- Si no hay duplicados, todo lo siguiente simplemente afecta 0 filas.

-- 1. Si por una versión antigua un duplicado llegó a organizar una reunión,
--    conservar la reunión y reasignarla a la identidad administrativa correcta.
UPDATE public.video_meetings r
SET organizer_id = m.new_id
FROM _domus_member_merge m
WHERE r.organizer_id = m.old_id;

-- 2. Copiar participación al miembro correcto antes de retirar el duplicado.
INSERT INTO public.video_meeting_participants(
  meeting_id,member_id,participation_status,email_status,added_at
)
SELECT
  p.meeting_id,
  m.new_id,
  CASE
    WHEN r.organizer_id=m.new_id OR p.participation_status='organizer' THEN 'organizer'
    ELSE p.participation_status
  END,
  p.email_status,
  p.added_at
FROM public.video_meeting_participants p
JOIN _domus_member_merge m ON m.old_id=p.member_id
JOIN public.video_meetings r ON r.id=p.meeting_id
ON CONFLICT(meeting_id,member_id) DO UPDATE SET
  participation_status = CASE
    WHEN public.video_meeting_participants.participation_status='organizer'
      OR EXCLUDED.participation_status='organizer' THEN 'organizer'
    ELSE public.video_meeting_participants.participation_status
  END;

-- 3. Trasladar consentimiento de transcripción cuando exista.
DO $$
BEGIN
  IF to_regclass('public.video_transcription_consent') IS NOT NULL THEN
    INSERT INTO public.video_transcription_consent(meeting_id,member_id,accepted,decided_at)
    SELECT c.meeting_id,m.new_id,c.accepted,c.decided_at
    FROM public.video_transcription_consent c
    JOIN _domus_member_merge m ON m.old_id=c.member_id
    ON CONFLICT(meeting_id,member_id) DO UPDATE SET
      accepted=EXCLUDED.accepted,
      decided_at=GREATEST(public.video_transcription_consent.decided_at,EXCLUDED.decided_at);

    DELETE FROM public.video_transcription_consent c
    USING _domus_member_merge m
    WHERE c.member_id=m.old_id;
  END IF;
END $$;

-- 4. Compatibilidad con el consentimiento antiguo de actas, si esa tabla existe.
DO $$
BEGIN
  IF to_regclass('public.video_minutes_consent') IS NOT NULL THEN
    INSERT INTO public.video_minutes_consent(meeting_id,member_id,accepted,decided_at)
    SELECT c.meeting_id,m.new_id,c.accepted,c.decided_at
    FROM public.video_minutes_consent c
    JOIN _domus_member_merge m ON m.old_id=c.member_id
    ON CONFLICT(meeting_id,member_id) DO UPDATE SET
      accepted=EXCLUDED.accepted,
      decided_at=GREATEST(public.video_minutes_consent.decided_at,EXCLUDED.decided_at);

    DELETE FROM public.video_minutes_consent c
    USING _domus_member_merge m
    WHERE c.member_id=m.old_id;
  END IF;
END $$;

-- 5. Mover invitaciones pendientes/históricas al miembro correcto.
INSERT INTO public.video_email_outbox(
  meeting_id,member_id,recipient_email,event_type,status,attempts,
  last_error,created_at,sent_at,claimed_at
)
SELECT
  o.meeting_id,
  m.new_id,
  COALESCE(a.email,o.recipient_email),
  o.event_type,
  o.status,
  o.attempts,
  o.last_error,
  o.created_at,
  o.sent_at,
  o.claimed_at
FROM public.video_email_outbox o
JOIN _domus_member_merge m ON m.old_id=o.member_id
JOIN public.video_members a ON a.id=m.new_id
WHERE COALESCE(a.email,o.recipient_email) IS NOT NULL
ON CONFLICT(meeting_id,member_id,event_type) DO NOTHING;

DELETE FROM public.video_email_outbox o
USING _domus_member_merge m
WHERE o.member_id=m.old_id;

-- 6. Las reservas de pantalla son temporales; se liberan para evitar bloquear cupos.
DELETE FROM public.video_screen_leases s
USING _domus_member_merge m
WHERE s.member_id=m.old_id;

-- 7. Ya copiada la participación, retirar la identidad duplicada de las reuniones.
DELETE FROM public.video_meeting_participants p
USING _domus_member_merge m
WHERE p.member_id=m.old_id;

-- 8. NO borrar el registro antiguo: puede estar referenciado en chats/transcripciones
--    históricos. Se desactiva para que no vuelva a aparecer en la agenda.
UPDATE public.video_members p
SET active=false, updated_at=now()
FROM _domus_member_merge m
WHERE p.id=m.old_id;

COMMIT;
