-- Tontine daily maintenance cron runner (PREPARATION ONLY — NOT SCHEDULED)
-- File: supabase/migrations/20260616120000_create_tontine_daily_maintenance_runner.sql
--
-- PURPOSE
--   A single SECURITY DEFINER entry point that the future cron (pg_cron via an
--   Edge Function, invoked with the service role) can call WITHOUT an end-user
--   auth context. The existing admin RPCs
--     - generate_daily_tontine_contributions(date)
--     - close_daily_tontine_contributions(date)
--   are gated by is_admin_or_super_admin() (auth.uid()), so a service-role /
--   postgres cron caller would always fail them. This runner reproduces the
--   same idempotent generate + safe close logic, intended for unattended use.
--
-- SECURITY MODEL
--   This function intentionally does NOT check is_admin_or_super_admin().
--   It is therefore granted to service_role ONLY (and never to authenticated /
--   anon / public). It must only ever be reached through the service role key
--   (Edge Function) or a pg_cron job running as a privileged role.
--
-- SAFETY GUARANTEES
--   * Single source of truth: operates ONLY on public.tontine_contributions.
--     It NEVER touches the legacy public.contributions table.
--   * Idempotent generation: relies on ON CONFLICT against
--     unique_user_category_cycle_date, so repeated runs add no duplicates.
--   * Never deletes rows. Closing is a status transition to 'overdue' only.
--   * Never validates payments.
--   * Never sends emails.
--   * Close date MUST be strictly before the generate date, so freshly
--     generated current-day rows can never be closed in the same run.
--   * dry_run = true (default) computes counts WITHOUT writing anything.
--
-- DEPLOYMENT
--   NOT applied. Review and apply manually only after sign-off. Scheduling is a
--   separate, later step (no cron.schedule call is included here).

CREATE OR REPLACE FUNCTION public.run_daily_tontine_maintenance(
  p_generate_date date,
  p_close_date date,
  p_dry_run boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_generated integer := 0;
  v_closed integer := 0;
  v_active_cycle_id uuid;
  v_active_count integer;
BEGIN
  -- Safety: close must target strictly-past dates relative to generation, so a
  -- run can never overdue the rows it just created for the current day.
  IF p_close_date >= p_generate_date THEN
    RAISE EXCEPTION 'La date de clôture (%) doit être strictement antérieure à la date de génération (%).',
      p_close_date, p_generate_date;
  END IF;

  -- Require exactly one active cycle (mirrors generate_daily_tontine_contributions).
  SELECT count(*) INTO v_active_count
  FROM public.tontine_cycles
  WHERE status = 'active';

  IF v_active_count = 0 THEN
    RAISE EXCEPTION 'Aucun cycle de tontine n''est actuellement actif. Impossible de générer les cotisations.';
  ELSIF v_active_count > 1 THEN
    RAISE EXCEPTION 'Plusieurs cycles de tontine sont actifs (%). Un seul cycle actif est autorisé.', v_active_count;
  END IF;

  SELECT id INTO v_active_cycle_id
  FROM public.tontine_cycles
  WHERE status = 'active';

  -- GENERATE -----------------------------------------------------------------
  IF p_dry_run THEN
    -- Count rows that WOULD be inserted (active member/category pairs without an
    -- existing contribution for the target day in the active cycle).
    SELECT count(*) INTO v_generated
    FROM public.member_tontine_categories mtc
    JOIN public.tontine_categories tc ON tc.id = mtc.category_id
    WHERE mtc.is_active = true
      AND tc.is_active = true
      AND NOT EXISTS (
        SELECT 1
        FROM public.tontine_contributions c
        WHERE c.user_id = mtc.user_id
          AND c.category_id = mtc.category_id
          AND c.cycle_id = v_active_cycle_id
          AND c.due_date = p_generate_date
      );
  ELSE
    WITH inserted AS (
      INSERT INTO public.tontine_contributions (
        user_id, category_id, cycle_id, due_date, expected_amount, paid_amount, status
      )
      SELECT
        mtc.user_id, mtc.category_id, v_active_cycle_id, p_generate_date, tc.daily_amount, 0, 'pending'
      FROM public.member_tontine_categories mtc
      JOIN public.tontine_categories tc ON tc.id = mtc.category_id
      WHERE mtc.is_active = true
        AND tc.is_active = true
      ON CONFLICT (user_id, category_id, cycle_id, due_date) DO NOTHING
      RETURNING 1
    )
    SELECT count(*) INTO v_generated FROM inserted;
  END IF;

  -- CLOSE (mark overdue) -----------------------------------------------------
  IF p_dry_run THEN
    -- Count rows that WOULD be marked overdue.
    SELECT count(*) INTO v_closed
    FROM public.tontine_contributions
    WHERE due_date <= p_close_date
      AND status IN ('pending', 'partial')
      AND paid_amount < expected_amount;
  ELSE
    WITH updated AS (
      UPDATE public.tontine_contributions
      SET status = 'overdue', updated_at = now()
      WHERE due_date <= p_close_date
        AND status IN ('pending', 'partial')
        AND paid_amount < expected_amount
      RETURNING 1
    )
    SELECT count(*) INTO v_closed FROM updated;
  END IF;

  RETURN jsonb_build_object(
    'generated_count', v_generated,
    'closed_overdue_count', v_closed,
    'target_generate_date', p_generate_date,
    'target_close_date', p_close_date,
    'dry_run', p_dry_run,
    'errors', '[]'::jsonb
  );
END;
$$;

-- Grants: service_role ONLY. Never authenticated / anon / public, because this
-- runner deliberately bypasses the admin gate.
REVOKE ALL ON FUNCTION public.run_daily_tontine_maintenance(date, date, boolean) FROM public;
REVOKE ALL ON FUNCTION public.run_daily_tontine_maintenance(date, date, boolean) FROM anon;
REVOKE ALL ON FUNCTION public.run_daily_tontine_maintenance(date, date, boolean) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.run_daily_tontine_maintenance(date, date, boolean) TO service_role;

-- NOTE: No cron.schedule(...) here on purpose. Scheduling is a deliberate,
-- separate manual step performed only after end-to-end review and sign-off.
