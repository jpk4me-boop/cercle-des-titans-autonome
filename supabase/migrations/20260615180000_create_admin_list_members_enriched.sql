-- Admin-only enriched member directory for /members filters (Phase 1)
-- File: supabase/migrations/20260615180000_create_admin_list_members_enriched.sql
--
-- SECURITY MODEL
--   This function is the ONLY place sensitive per-member tontine / financing /
--   overdue signals are exposed. It is SECURITY DEFINER and gated by
--   public.is_admin_or_super_admin(): non-admins get an exception, never data.
--   The public view member_directory_public is intentionally NOT widened.
--
-- LIMITATION (financing_requests)
--   public.financing_requests has NO user_id column. The only available link to
--   a member is the email address, so financing data is matched by
--   profiles.email = financing_requests.email. This is approximate: a member
--   who used a different email when submitting a request will NOT be linked, and
--   two members sharing an email would cross-link. Documented intentionally.

CREATE OR REPLACE FUNCTION public.admin_list_members_enriched()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  first_name text,
  last_name text,
  avatar_url text,
  city text,
  profession text,
  email text,
  recommended_category text,
  role text,
  tontine_category_names text[],
  has_active_tontine boolean,
  has_contributions boolean,
  has_declared_payment boolean,
  has_validated_payment boolean,
  has_overdue_contribution boolean,
  has_financing_request boolean,
  financing_statuses text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Authorization: admins / super_admins only.
  IF NOT public.is_admin_or_super_admin() THEN
    RAISE EXCEPTION 'Non autorisé. Droits administrateur requis.';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.first_name,
    p.last_name,
    p.avatar_url,
    p.city,
    p.profession,
    p.email,
    p.recommended_category,
    ur.role AS role,
    COALESCE(tcat.active_names, ARRAY[]::text[]) AS tontine_category_names,
    COALESCE(tcat.has_active, false) AS has_active_tontine,
    EXISTS (
      SELECT 1 FROM public.tontine_contributions tc WHERE tc.user_id = p.user_id
    ) AS has_contributions,
    EXISTS (
      SELECT 1 FROM public.contribution_payments cp WHERE cp.user_id = p.user_id
    ) AS has_declared_payment,
    EXISTS (
      SELECT 1 FROM public.contribution_payments cp
      WHERE cp.user_id = p.user_id AND cp.status = 'paid'
    ) AS has_validated_payment,
    EXISTS (
      SELECT 1 FROM public.tontine_contributions tc
      WHERE tc.user_id = p.user_id AND tc.status = 'overdue'
    ) AS has_overdue_contribution,
    COALESCE(fin.has_request, false) AS has_financing_request,
    COALESCE(fin.statuses, ARRAY[]::text[]) AS financing_statuses
  FROM public.profiles p
  -- Pick a single representative role (highest privilege first) for the badge.
  LEFT JOIN LATERAL (
    SELECT (ur2.role)::text AS role
    FROM public.user_roles ur2
    WHERE ur2.user_id = p.user_id
    ORDER BY CASE ur2.role
      WHEN 'admin' THEN 1
      WHEN 'moderator' THEN 2
      WHEN 'investor' THEN 3
      WHEN 'user' THEN 4
      ELSE 5
    END
    LIMIT 1
  ) ur ON true
  -- Active tontine category names + whether any membership is active.
  LEFT JOIN LATERAL (
    SELECT
      array_agg(DISTINCT c.name) FILTER (WHERE m.is_active) AS active_names,
      bool_or(m.is_active) AS has_active
    FROM public.member_tontine_categories m
    JOIN public.tontine_categories c ON c.id = m.category_id
    WHERE m.user_id = p.user_id
  ) tcat ON true
  -- Financing requests linked by EMAIL ONLY (see limitation note above).
  LEFT JOIN LATERAL (
    SELECT
      (count(*) > 0) AS has_request,
      array_agg(DISTINCT f.status) AS statuses
    FROM public.financing_requests f
    WHERE p.email IS NOT NULL AND f.email = p.email
  ) fin ON true
  -- Exclude super_admins from the directory.
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles ur3
    WHERE ur3.user_id = p.user_id AND ur3.role = 'super_admin'
  )
  ORDER BY p.first_name NULLS LAST, p.last_name NULLS LAST;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_members_enriched() FROM public;
GRANT EXECUTE ON FUNCTION public.admin_list_members_enriched() TO authenticated;
