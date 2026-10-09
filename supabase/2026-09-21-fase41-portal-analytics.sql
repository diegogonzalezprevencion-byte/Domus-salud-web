-- DOMUS SALUD · Fase 4.1 · portal de accesos y exclusión verificable del equipo.
-- Ejecutar DESPUÉS de la Fase 4. No altera datos clínicos, videollamadas ni historial.
-- No es posible identificar automáticamente visitas históricas anónimas ya mezcladas.
BEGIN;

-- El servidor verifica un JWT real, NO el botón elegido en la portada.
CREATE OR REPLACE FUNCTION public.domus_analytics_is_internal()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS (
   SELECT 1 FROM public.video_members m
   WHERE m.auth_user_id=(SELECT auth.uid()) AND m.active
     AND m.role IN ('admin','professional')
 );
$$;
REVOKE ALL ON FUNCTION public.domus_analytics_is_internal() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.domus_analytics_is_internal() TO anon,authenticated;

-- Conserva eventos brutos; excluir solo sesiones cuya identidad interna se comprobó.
CREATE TABLE IF NOT EXISTS public.domus_analytics_internal_sessions (
 session_id text PRIMARY KEY CHECK (length(session_id) BETWEEN 16 AND 128),
 auth_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 verified_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.domus_analytics_internal_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.domus_analytics_internal_sessions FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.domus_analytics_register_internal(p_session_id text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT public.domus_analytics_is_internal() THEN
   RAISE EXCEPTION 'Solo personal verificado puede registrar su sesión.' USING ERRCODE='42501';
 END IF;
 IF p_session_id IS NULL OR p_session_id !~ '^session-[0-9]{10,16}-[a-z0-9]{6,20}$' THEN
   RAISE EXCEPTION 'Identificador de sesión inválido.' USING ERRCODE='22023';
 END IF;
 INSERT INTO public.domus_analytics_internal_sessions(session_id,auth_user_id)
 VALUES(p_session_id,(SELECT auth.uid()))
 ON CONFLICT(session_id) DO UPDATE SET auth_user_id=EXCLUDED.auth_user_id,verified_at=now();
 RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.domus_analytics_register_internal(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.domus_analytics_register_internal(text) TO authenticated;

-- Cerrar inserciones públicas para usuarios internos autenticados.
DROP POLICY IF EXISTS analytics_public_insert ON public.analytics_events;
DROP POLICY IF EXISTS "Analytics events insert" ON public.analytics_events;
CREATE POLICY analytics_public_insert ON public.analytics_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    NOT public.domus_analytics_is_internal() AND (
    (
      audience = 'public'
      AND event_type IN ('page_view','section_view','click','contact_submit')
      AND admin_user_id IS NULL AND admin_username IS NULL
      AND professional_id IS NULL AND professional_username IS NULL
      AND metadata = '{}'::jsonb
    ) OR (
      audience = 'patient'
      AND event_type IN ('patient_form_open','patient_form_submit')
      AND admin_user_id IS NULL AND admin_username IS NULL
      AND professional_id IS NULL AND professional_username IS NULL
      AND visitor_id IS NULL AND session_id IS NULL
      AND metadata = '{}'::jsonb
    )
  ));

-- Recalcular histórico y actividad, sin borrar registros fuente.
CREATE OR REPLACE FUNCTION public.domus_analytics_dashboard(p_months text[] DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_result jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.video_members m
    WHERE m.auth_user_id = (SELECT auth.uid()) AND m.role = 'admin' AND m.active
  ) THEN RAISE EXCEPTION 'Acceso reservado a administradores.' USING ERRCODE = '42501'; END IF;
  IF p_months IS NOT NULL AND (
    cardinality(p_months)>120 OR EXISTS (
      SELECT 1 FROM unnest(p_months) x
      WHERE x IS NULL OR x !~ '^[0-9]{4}-(0[1-9]|1[0-2])$'
    )
  ) THEN RAISE EXCEPTION 'Meses inválidos.' USING ERRCODE='22023'; END IF;

  WITH available AS (
    SELECT DISTINCT to_char(created_at AT TIME ZONE 'America/Santiago','YYYY-MM') AS month
    FROM public.analytics_events e WHERE e.audience IN ('public','patient')
      AND e.admin_user_id IS NULL AND e.professional_id IS NULL
      AND NOT EXISTS (SELECT 1 FROM public.domus_analytics_internal_sessions x WHERE x.session_id=e.session_id)
  ), scoped AS (
    SELECT e.*,
      to_char(e.created_at AT TIME ZONE 'America/Santiago','YYYY-MM') AS month
    FROM public.analytics_events e
    WHERE e.audience IN ('public','patient')
      AND e.admin_user_id IS NULL AND e.professional_id IS NULL
      AND NOT EXISTS (SELECT 1 FROM public.domus_analytics_internal_sessions x WHERE x.session_id=e.session_id)
      AND (p_months IS NULL OR to_char(e.created_at AT TIME ZONE 'America/Santiago','YYYY-MM') = ANY(p_months))
  ), metrics AS (
    SELECT
      count(*) FILTER (WHERE event_type='page_view') AS visits,
      count(DISTINCT session_id) FILTER (WHERE audience='public') AS sessions,
      count(DISTINCT coalesce(visitor_id,session_id)) FILTER (WHERE audience='public') AS visitors,
      count(*) FILTER (WHERE event_type='click') AS clicks,
      count(*) FILTER (WHERE event_type='section_view') AS section_views,
      count(*) FILTER (WHERE event_type='contact_submit') AS submissions,
      count(*) FILTER (WHERE event_type='patient_form_open') AS patient_form_opens,
      count(*) FILTER (WHERE event_type='patient_form_submit') AS patient_forms,
      count(*) FILTER (WHERE event_type='click' AND (
        lower(coalesce(event_label,'')) LIKE '%whatsapp%'
        OR lower(coalesce(event_target,'')) LIKE '%whatsapp%'
      )) AS whatsapp,
      min(created_at) AS first_at,
      max(created_at) AS last_at
    FROM scoped
  ), monthly AS (
    SELECT month,
      count(*) FILTER (WHERE event_type='page_view') AS visits,
      count(DISTINCT session_id) AS sessions,
      count(*) FILTER (WHERE event_type='click') AS clicks,
      count(*) FILTER (WHERE event_type='contact_submit') AS submissions
    FROM scoped GROUP BY month
  ), clicks AS (
    SELECT coalesce(nullif(left(event_label,100),''),'Acción sin nombre') AS label, count(*) AS total
    FROM scoped WHERE event_type='click'
    GROUP BY 1 ORDER BY total DESC,label LIMIT 12
  ), sections AS (
    SELECT coalesce(nullif(left(section,100),''),'Sin sección') AS label, count(*) AS total
    FROM scoped WHERE event_type='section_view'
    GROUP BY 1 ORDER BY total DESC,label LIMIT 12
  ), devices AS (
    SELECT coalesce(nullif(left(device_type,40),''),'Sin datos') AS label,
      count(*) FILTER (WHERE event_type='page_view') AS total
    FROM scoped GROUP BY 1 ORDER BY total DESC,label
  ), navigation AS (
    SELECT count(*) AS engaged_sessions FROM (
      SELECT session_id FROM scoped
      WHERE audience='public' AND session_id IS NOT NULL
      GROUP BY session_id HAVING count(DISTINCT section) FILTER (WHERE event_type='section_view')>=2
    ) sessions_with_navigation
  )
  SELECT jsonb_build_object(
    'metrics',(SELECT jsonb_build_object(
      'visits',visits,'sessions',sessions,'visitors',visitors,'clicks',clicks,
      'sectionViews',section_views,'submissions',submissions,'patientFormOpens',patient_form_opens,
      'patientForms',patient_forms,'whatsapp',whatsapp,'firstAt',first_at,'lastAt',last_at,
      'conversionRate', CASE WHEN visits>0 THEN round(100.0*submissions/visits,1) ELSE 0 END
    ) FROM metrics),
    'engagedSessions',(SELECT engaged_sessions FROM navigation),
    'availableMonths',coalesce((SELECT jsonb_agg(month ORDER BY month DESC) FROM available),'[]'::jsonb),
    'monthly',coalesce((SELECT jsonb_agg(jsonb_build_object('month',month,'visits',visits,
      'sessions',sessions,'clicks',clicks,'submissions',submissions) ORDER BY month) FROM monthly),'[]'::jsonb),
    'topClicks',coalesce((SELECT jsonb_agg(jsonb_build_object('label',label,'count',total) ORDER BY total DESC,label) FROM clicks),'[]'::jsonb),
    'topSections',coalesce((SELECT jsonb_agg(jsonb_build_object('label',label,'count',total) ORDER BY total DESC,label) FROM sections),'[]'::jsonb),
    'devices',coalesce((SELECT jsonb_agg(jsonb_build_object('label',label,'count',total) ORDER BY total DESC,label) FROM devices),'[]'::jsonb)
  ) INTO v_result;
  RETURN v_result;
END; $$;

CREATE OR REPLACE FUNCTION public.domus_analytics_activity(
  p_from date DEFAULT NULL,p_to date DEFAULT NULL,
  p_limit integer DEFAULT 25,p_offset integer DEFAULT 0
)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_result jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.video_members m
    WHERE m.auth_user_id = (SELECT auth.uid()) AND m.role = 'admin' AND m.active
  ) THEN RAISE EXCEPTION 'Acceso reservado a administradores.' USING ERRCODE='42501'; END IF;
  IF (p_from IS NOT NULL AND p_to IS NOT NULL AND p_from>p_to)
    OR p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 100
    OR p_offset IS NULL OR p_offset NOT BETWEEN 0 AND 1000000
  THEN RAISE EXCEPTION 'Filtro de actividad inválido.' USING ERRCODE='22023'; END IF;
  WITH scoped AS (
    SELECT e.id,e.audience,e.event_type,e.event_label,e.section,e.device_type,e.created_at
    FROM public.analytics_events e
    WHERE e.audience IN ('public','patient')
      AND e.admin_user_id IS NULL AND e.professional_id IS NULL
      AND NOT EXISTS (SELECT 1 FROM public.domus_analytics_internal_sessions x WHERE x.session_id=e.session_id)
      AND (p_from IS NULL OR e.created_at >= (p_from::timestamp AT TIME ZONE 'America/Santiago'))
      AND (p_to IS NULL OR e.created_at < ((p_to+1)::timestamp AT TIME ZONE 'America/Santiago'))
  ), paged AS (
    SELECT * FROM scoped ORDER BY created_at DESC,id DESC
    LIMIT p_limit OFFSET p_offset
  )
  SELECT jsonb_build_object(
    'total',(SELECT count(*) FROM scoped),
    'events',coalesce((SELECT jsonb_agg(jsonb_build_object(
      'label',coalesce(left(event_label,120),event_type),
      'type',event_type,'section',left(coalesce(section,''),80),
      'device',left(coalesce(device_type,''),40),'audience',audience,'time',created_at
    ) ORDER BY created_at DESC,id DESC) FROM paged),'[]'::jsonb)
  ) INTO v_result;
  RETURN v_result;
END; $$;

REVOKE ALL ON FUNCTION public.domus_analytics_dashboard(text[]) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.domus_analytics_activity(date,date,integer,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.domus_analytics_dashboard(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.domus_analytics_activity(date,date,integer,integer) TO authenticated;
COMMIT;
