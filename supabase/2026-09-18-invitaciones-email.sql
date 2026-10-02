-- DOMUS SALUD: envío seguro de invitaciones de reunión, continuación de 2026-09-17-videollamadas.sql.
-- Ejecutar UNA VEZ en el proyecto correcto. No cambia los datos clínicos ni borra reuniones existentes.
BEGIN;

ALTER TABLE public.video_email_outbox
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz;

ALTER TABLE public.video_email_outbox
  DROP CONSTRAINT IF EXISTS video_email_outbox_status_check;
ALTER TABLE public.video_email_outbox
  ADD CONSTRAINT video_email_outbox_status_check CHECK (
    status IN ('awaiting_email_setup', 'pending', 'sending', 'sent', 'failed')
  );

-- Reclamo atómico para evitar que dos peticiones envíen simultáneamente la misma invitación.
-- Sólo el servidor con service_role puede ejecutar esta función. Los usuarios autenticados NO pueden.
CREATE OR REPLACE FUNCTION public.video_claim_pending_invitations(p_meeting_id uuid)
RETURNS TABLE (outbox_id uuid, member_id text, recipient_email text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  WITH eligible AS (
    SELECT o.id
    FROM public.video_email_outbox AS o
    JOIN public.video_meetings AS m ON m.id = o.meeting_id
    WHERE o.meeting_id = p_meeting_id
      AND m.status = 'scheduled'
      AND o.event_type = 'invitation'
      AND o.attempts < 5
      AND (
        o.status IN ('awaiting_email_setup', 'pending', 'failed')
        OR (o.status = 'sending' AND o.claimed_at < now() - interval '15 minutes')
      )
    ORDER BY o.created_at, o.id
    FOR UPDATE OF o SKIP LOCKED
    LIMIT 100
  ), claimed AS (
    UPDATE public.video_email_outbox AS o
    SET status = 'sending',
        attempts = o.attempts + 1,
        claimed_at = now(),
        last_error = NULL
    FROM eligible AS e
    WHERE o.id = e.id
    RETURNING o.id, o.member_id, o.recipient_email
  )
  SELECT c.id, c.member_id, c.recipient_email FROM claimed AS c;
END;
$$;

REVOKE ALL ON FUNCTION public.video_claim_pending_invitations(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.video_claim_pending_invitations(uuid) TO service_role;
COMMIT;

-- Verificación: la función debe aparecer una sola vez.
-- SELECT proname FROM pg_proc WHERE proname = 'video_claim_pending_invitations';
