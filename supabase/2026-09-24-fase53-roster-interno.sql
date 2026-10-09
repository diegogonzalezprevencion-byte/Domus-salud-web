-- ============================================================
-- DOMUS SALUD · FASE 5.3
-- PARTICIPANTES REGISTRADOS SIN IDENTIDADES DE INVITADOS
-- ============================================================
-- Ejecutar DESPUÉS de Fase 5.2.
-- No elimina ni desactiva identidades guest:*.
-- Los invitados externos se conservan para sus historiales,
-- chats, transcripciones y reuniones originales.
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.video_registered_members()
RETURNS TABLE (
  id text,
  display_name text,
  email text,
  role text,
  active boolean,
  auth_user_id uuid
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Solo un miembro interno activo y autenticado puede consultar
  -- el directorio utilizado para programar reuniones.
  IF NOT EXISTS (
    SELECT 1
    FROM public.video_members caller
    WHERE caller.auth_user_id = (SELECT auth.uid())
      AND caller.active = true
      AND caller.id NOT LIKE 'guest:%'
      AND caller.role IN ('admin','professional')
  ) THEN
    RAISE EXCEPTION 'Acceso reservado a miembros internos de Domus Salud.'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    m.id,
    m.display_name,
    m.email,
    m.role,
    m.active,
    m.auth_user_id
  FROM public.video_members m
  WHERE m.active = true
    AND m.id NOT LIKE 'guest:%'
    AND m.role IN ('admin','professional')
  ORDER BY
    m.display_name,
    CASE WHEN m.role = 'admin' THEN 0 ELSE 1 END,
    m.id;
END;
$$;

REVOKE ALL
ON FUNCTION public.video_registered_members()
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.video_registered_members()
TO authenticated;

COMMIT;
