-- Harden RLS on the LEGACY public.contributions table.
-- File: supabase/migrations/20260618090000_harden_legacy_contributions_rls.sql
--
-- STATUS: DRAFT — NOT APPLIED. Do not deploy without manual validation.
--
-- CONTEXT
--   public.contributions is the LEGACY contributions table. The application
--   frontend has been migrated and now reads/writes ONLY public.tontine_contributions
--   (the new tontine module). tontine_contributions is the SINGLE SOURCE OF TRUTH.
--   This migration freezes the legacy table at the RLS layer so no authenticated
--   end-user can create/modify/delete legacy contribution rows.
--
-- WHY
--   The repository history created a PERMISSIVE `FOR ALL` policy
--   ("Deny anonymous access to contributions") with USING (auth.uid() IS NOT NULL).
--   Because permissive policies are OR-combined, that policy would grant EVERY
--   authenticated user full SELECT/INSERT/UPDATE/DELETE on ALL rows — a critical
--   confidentiality + integrity hole. This migration removes that policy and all
--   member self-write policies, then revokes write privileges entirely.
--
-- IMPORTANT — MIGRATION HISTORY DRIFT
--   The live database schema currently diverges from this repo's migration history
--   (objects applied outside the CLI; some legacy policies already dropped manually).
--   Do NOT run `supabase db push` until repo <-> live are reconciled. This file is
--   written to be IDEMPOTENT (DROP ... IF EXISTS / REVOKE) so it converges safely to
--   the intended locked state whether or not the policies still exist.
--
-- SAFETY — does NOT break send-contribution-reminders
--   The Edge Function send-contribution-reminders connects with the SERVICE ROLE key,
--   which BYPASSES Row Level Security entirely. Tightening RLS / revoking the
--   authenticated & anon roles therefore does NOT affect it. (Do NOT revoke from
--   service_role or postgres, and do NOT DROP the table.)
--
-- SCOPE
--   * Touches ONLY public.contributions.
--   * Does NOT touch public.tontine_contributions or the new tontine module.

-- 0. Defensive: ensure RLS stays enabled on the legacy table.
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

-- 1. Remove the permissive FOR ALL policy (root cause of the hole).
DROP POLICY IF EXISTS "Deny anonymous access to contributions" ON public.contributions;

-- 2-4. Remove member self-write policies (frontend no longer writes the legacy table).
DROP POLICY IF EXISTS "Users can insert their own contributions" ON public.contributions;
DROP POLICY IF EXISTS "Users can update their own contributions" ON public.contributions;
DROP POLICY IF EXISTS "Users can delete their own contributions" ON public.contributions;

-- 5. Belt-and-braces: revoke write privileges from the client roles.
--    service_role and postgres are intentionally left untouched (Edge Function + maintenance).
REVOKE INSERT, UPDATE, DELETE ON public.contributions FROM authenticated, anon;

-- 6. SELECT (read) — kept "if needed".
--    Current live state: the legacy table has RLS enabled with NO policies, i.e. it is
--    fully locked for the authenticated/anon roles (deny-all). Since the app no longer
--    reads the legacy table, no SELECT policy is required and the table stays locked.
--
--    OPTIONAL — uncomment ONLY if an admin/super_admin must read legacy rows from a
--    client session (read-only). Left disabled by default to preserve the locked state.
--    Requires the helper public.is_admin_or_super_admin() (present in the live DB).
--
--    DROP POLICY IF EXISTS "Admins read legacy contributions" ON public.contributions;
--    CREATE POLICY "Admins read legacy contributions"
--      ON public.contributions
--      FOR SELECT
--      TO authenticated
--      USING (public.is_admin_or_super_admin());

-- 7. Document the legacy status at the schema level.
COMMENT ON TABLE public.contributions IS
  'LEGACY table — frozen. The source of truth for contributions is public.tontine_contributions '
  '(new tontine module). Client roles (authenticated/anon) have no write access and, by default, '
  'no read access (RLS enabled, no client policy). Only service_role/postgres may access it '
  '(e.g. the send-contribution-reminders Edge Function). Do not add new dependencies on this table.';
