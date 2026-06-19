-- APPLIED MANUALLY 2026-06-19 — DO NOT RE-APPLY.
-- File: supabase/applied-manual/20260619_member_account_status.applied.sql
-- Supabase project: txllxnqcptegsgwkvzeb
--
-- STATUS: Applied manually (out of the CLI), NOT registered in
-- supabase_migrations.schema_migrations. Kept here as an audit record only.
-- Do NOT move this into supabase/migrations/ and do NOT re-run it.
--
-- SCOPE
--   * Creates public.member_account_status (one row per member, default 'active').
--   * RLS: a member reads ONLY their own status; admins read all. There is NO client
--     write policy at all, so the table can only be written through the SECURITY
--     DEFINER RPC admin_set_member_status below.
--   * Adds helper public.current_member_status() consumed by the guards draft
--     (20260619_draft_member_status_guards.sql).
--
-- DOES NOT TOUCH: auth.users, user_roles, roles, or any existing tontine data.
-- DEPENDS ON: public.is_admin_or_super_admin() (already present in the live DB).

-- 1. Table -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.member_account_status (
  user_id      uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'active'
               CHECK (status IN ('active', 'paused', 'suspended', 'banned')),
  reason       text,
  paused_until timestamptz,
  suspended_at timestamptz,
  banned_at    timestamptz,
  updated_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.member_account_status ENABLE ROW LEVEL SECURITY;

-- 2. RLS: read self or admin. NO INSERT/UPDATE/DELETE policy for client roles ---
--    (writes flow exclusively through admin_set_member_status).
DROP POLICY IF EXISTS "member status select self or admin" ON public.member_account_status;
CREATE POLICY "member status select self or admin" ON public.member_account_status
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin_or_super_admin());

-- 3. Helper: status of the calling member, defaulting to 'active' when no row ---
--    SECURITY DEFINER so it can read the table regardless of the caller's own RLS
--    visibility; it only ever reads the row for auth.uid().
CREATE OR REPLACE FUNCTION public.current_member_status()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT status FROM public.member_account_status WHERE user_id = auth.uid()),
    'active'
  );
$$;

REVOKE ALL ON FUNCTION public.current_member_status() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.current_member_status() TO authenticated;

-- 4. Admin RPC: the ONLY write path. The validator is auth.uid() server-side, so
--    p_updated_by is never trusted from the client. Admin/super_admin only.
CREATE OR REPLACE FUNCTION public.admin_set_member_status(
  p_user_id uuid,
  p_status  text,
  p_reason  text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_or_super_admin() THEN
    RAISE EXCEPTION 'Non autorisé. Droits administrateur requis.';
  END IF;

  IF p_status NOT IN ('active', 'paused', 'suspended', 'banned') THEN
    RAISE EXCEPTION 'Statut invalide. Doit être active, paused, suspended ou banned.';
  END IF;

  INSERT INTO public.member_account_status (
    user_id, status, reason, updated_by, updated_at, suspended_at, banned_at
  )
  VALUES (
    p_user_id, p_status, p_reason, auth.uid(), now(),
    CASE WHEN p_status = 'suspended' THEN now() END,
    CASE WHEN p_status = 'banned'    THEN now() END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    status       = EXCLUDED.status,
    reason       = EXCLUDED.reason,
    updated_by   = auth.uid(),
    updated_at   = now(),
    suspended_at = CASE WHEN EXCLUDED.status = 'suspended' THEN now()
                        ELSE public.member_account_status.suspended_at END,
    banned_at    = CASE WHEN EXCLUDED.status = 'banned' THEN now()
                        ELSE public.member_account_status.banned_at END;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_member_status(uuid, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_member_status(uuid, text, text) TO authenticated;

-- NOTE: paused_until is reserved for a future "temporary pause" expiry and is not
-- set by admin_set_member_status yet. Add a parameter later if/when needed.
