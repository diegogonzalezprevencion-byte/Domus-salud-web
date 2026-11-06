-- DOMUS SALUD FASE 6.6: accesos profesionales agregados sin identificar a personas.
-- Ejecutar una sola vez en Supabase > SQL Editor.
-- No borra historial; mantiene los procedimientos del dashboard con permisos restringidos.
BEGIN;

-- La Fase 5.4 bloqueaba todo evento interno, incluso el recuento de acceso.
-- Se permite EXCLUSIVAMENTE un evento de ingreso profesional sin datos personales,
-- ni metadatos, ni identificadores de sesión. La autenticación profesional
-- sigue siendo responsabilidad de la app; el contador no verifica identidad.
DROP POLICY IF EXISTS analytics_public_insert ON public.analytics_events;
CREATE POLICY analytics_public_insert
ON public.analytics_events
FOR INSERT TO anon,authenticated
WITH CHECK (
  (
    NOT public.domus_analytics_is_internal()
    AND (
      (audience='public' AND event_type IN ('page_view','contact_submit')
        AND session_id IS NULL AND visitor_id IS NULL
        AND admin_user_id IS NULL AND admin_username IS NULL
        AND professional_id IS NULL AND professional_username IS NULL
        AND metadata='{}'::jsonb)
      OR
      (audience='public' AND event_type IN ('section_view','click')
        AND session_id IS NOT NULL AND length(session_id) BETWEEN 16 AND 128
        AND visitor_id IS NULL AND admin_user_id IS NULL AND admin_username IS NULL
        AND professional_id IS NULL AND professional_username IS NULL
        AND metadata='{}'::jsonb)
      OR
      (audience='patient' AND event_type IN ('patient_form_open','patient_form_submit')
        AND session_id IS NULL AND visitor_id IS NULL
        AND admin_user_id IS NULL AND admin_username IS NULL
        AND professional_id IS NULL AND professional_username IS NULL
        AND metadata='{}'::jsonb)
    )
  )
  OR
  (audience='professional' AND event_type='professional_login'
    AND event_label='Ingreso profesional'
    AND event_target='acceso-profesional'
    AND section='profesional'
    AND session_id IS NULL AND visitor_id IS NULL
    AND admin_user_id IS NULL AND admin_username IS NULL
    AND professional_id IS NULL AND professional_username IS NULL
    AND metadata='{}'::jsonb)
);

CREATE OR REPLACE FUNCTION public.domus_analytics_activity(
  p_from date DEFAULT NULL,
  p_to date DEFAULT NULL,
  p_limit integer DEFAULT 25,
  p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.video_members m
    WHERE m.auth_user_id=(SELECT auth.uid()) AND m.role='admin' AND m.active
  ) THEN
    RAISE EXCEPTION 'Acceso reservado a administradores.' USING ERRCODE='42501';
  END IF;
  IF (p_from IS NOT NULL AND p_to IS NOT NULL AND p_from>p_to)
     OR p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 100
     OR p_offset IS NULL OR p_offset NOT BETWEEN 0 AND 1000000 THEN
    RAISE EXCEPTION 'Filtro de actividad inválido.' USING ERRCODE='22023';
  END IF;
  WITH scoped AS (
    SELECT e.id,e.audience,e.event_type,e.event_label,e.section,e.device_type,e.created_at
    FROM public.analytics_events e
    WHERE (
      ( ((e.audience='public' AND e.event_type='page_view')
        OR (e.audience='patient' AND e.event_type='patient_form_open'))
        AND e.admin_user_id IS NULL AND e.admin_username IS NULL
        AND e.professional_id IS NULL AND e.professional_username IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM public.domus_analytics_internal_sessions x
          WHERE x.session_id=e.session_id
        ))
      OR
      (e.audience='professional' AND e.event_type='professional_login'
        AND e.event_label='Ingreso profesional'
        AND e.admin_user_id IS NULL AND e.admin_username IS NULL)
    )
    AND (p_from IS NULL OR e.created_at >= (p_from::timestamp AT TIME ZONE 'America/Santiago'))
    AND (p_to IS NULL OR e.created_at < ((p_to+1)::timestamp AT TIME ZONE 'America/Santiago'))
  ),
  paged AS (
    SELECT * FROM scoped ORDER BY created_at DESC,id DESC
    LIMIT p_limit OFFSET p_offset
  )
  SELECT jsonb_build_object(
    'total',(SELECT count(*) FROM scoped),
    'events',coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'label',coalesce(left(event_label,120),event_type),
        'type',event_type,
        'section',left(coalesce(section,''),80),
        'device',left(coalesce(device_type,''),40),
        'audience',audience,
        'time',created_at
      ) ORDER BY created_at DESC,id DESC) FROM paged
    ),'[]'::jsonb)
  ) INTO v_result;
  RETURN v_result;
END;
$$;
REVOKE ALL ON FUNCTION public.domus_analytics_activity(date,date,integer,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.domus_analytics_activity(date,date,integer,integer) TO authenticated;
COMMIT;
