-- Weekly tontine generation & maintenance (clean weekly model).
-- DRAFT — do NOT deploy without manual validation. Run AFTER 20260616130000_harmonize_tontine_categories.sql
-- (this migration depends on tontine_categories.weekly_amount and .frequency).
--
-- Model: official tiers are WEEKLY. expected_amount = weekly_amount (integer FCFA, no decimals),
-- one contribution per member/category per week (due_date = the week's due date).
-- The existing close logic (close_daily_tontine_contributions / the runner's close branch) is
-- cadence-agnostic (it overdue's any pending/partial past a date) and is reused as-is.
--
-- Admin security is preserved: generate_weekly_tontine_contributions keeps the
-- is_admin_or_super_admin() gate; run_weekly_tontine_maintenance is service_role only.

-- 1. Weekly generation (admin-gated) -----------------------------------------
CREATE OR REPLACE FUNCTION public.generate_weekly_tontine_contributions(p_week_due_date date)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
  v_active_cycle_id uuid;
  v_active_count integer;
  r_member RECORD;
BEGIN
  IF NOT public.is_admin_or_super_admin() THEN
    RAISE EXCEPTION 'Non autorisé. Droits administrateur requis.';
  END IF;

  -- Exactly one active cycle (mirrors the daily generator).
  SELECT count(*) INTO v_active_count
  FROM public.tontine_cycles
  WHERE status = 'active';

  IF v_active_count = 0 THEN
    RAISE EXCEPTION 'Aucun cycle de tontine n''est actuellement actif. Impossible de générer les cotisations.';
  ELSIF v_active_count > 1 THEN
    RAISE EXCEPTION 'Plusieurs cycles de tontine sont actifs (%). Un seul cycle actif est autorisé pour générer les cotisations.', v_active_count;
  END IF;

  SELECT id INTO v_active_cycle_id
  FROM public.tontine_cycles
  WHERE status = 'active';

  FOR r_member IN
    SELECT mtc.user_id, mtc.category_id, tc.weekly_amount
    FROM public.member_tontine_categories mtc
    JOIN public.tontine_categories tc ON mtc.category_id = tc.id
    WHERE mtc.is_active = true
      AND tc.is_active = true
      AND tc.frequency = 'weekly'   -- only weekly tiers
  LOOP
    INSERT INTO public.tontine_contributions (
      user_id, category_id, cycle_id, due_date, expected_amount, paid_amount, status
    )
    VALUES (
      r_member.user_id, r_member.category_id, v_active_cycle_id,
      p_week_due_date, r_member.weekly_amount, 0, 'pending'   -- integer weekly amount
    )
    ON CONFLICT (user_id, category_id, cycle_id, due_date) DO NOTHING;

    IF FOUND THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.generate_weekly_tontine_contributions(date) FROM public;
GRANT EXECUTE ON FUNCTION public.generate_weekly_tontine_contributions(date) TO authenticated;

-- 2. Weekly unattended maintenance (service_role only) ------------------------
--    Mirror of run_daily_tontine_maintenance but: expected_amount = tc.weekly_amount,
--    filtered on frequency='weekly'. Close branch is cadence-agnostic (unchanged logic).
CREATE OR REPLACE FUNCTION public.run_weekly_tontine_maintenance(
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
  -- Close must target strictly-past dates relative to generation.
  IF p_close_date >= p_generate_date THEN
    RAISE EXCEPTION 'La date de clôture (%) doit être strictement antérieure à la date de génération (%).',
      p_close_date, p_generate_date;
  END IF;

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

  -- GENERATE (weekly) ---------------------------------------------------------
  IF p_dry_run THEN
    SELECT count(*) INTO v_generated
    FROM public.member_tontine_categories mtc
    JOIN public.tontine_categories tc ON tc.id = mtc.category_id
    WHERE mtc.is_active = true
      AND tc.is_active = true
      AND tc.frequency = 'weekly'
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
        mtc.user_id, mtc.category_id, v_active_cycle_id, p_generate_date, tc.weekly_amount, 0, 'pending'
      FROM public.member_tontine_categories mtc
      JOIN public.tontine_categories tc ON tc.id = mtc.category_id
      WHERE mtc.is_active = true
        AND tc.is_active = true
        AND tc.frequency = 'weekly'
      ON CONFLICT (user_id, category_id, cycle_id, due_date) DO NOTHING
      RETURNING 1
    )
    SELECT count(*) INTO v_generated FROM inserted;
  END IF;

  -- CLOSE (mark overdue) — cadence-agnostic -----------------------------------
  IF p_dry_run THEN
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

REVOKE ALL ON FUNCTION public.run_weekly_tontine_maintenance(date, date, boolean) FROM public;
REVOKE ALL ON FUNCTION public.run_weekly_tontine_maintenance(date, date, boolean) FROM anon;
REVOKE ALL ON FUNCTION public.run_weekly_tontine_maintenance(date, date, boolean) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.run_weekly_tontine_maintenance(date, date, boolean) TO service_role;

-- 3. Lock the legacy DAILY runner too -----------------------------------------
--    Same body as run_daily_tontine_maintenance, with `tc.frequency = 'daily'` added to both
--    the dry-run count and the real INSERT, so the unattended daily runner can never generate
--    a weekly category as a daily contribution. (Companion to the generate_daily lock in
--    20260616130000.) Remove this block if you prefer to keep point 3 strictly to generate_daily.
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
  IF p_close_date >= p_generate_date THEN
    RAISE EXCEPTION 'La date de clôture (%) doit être strictement antérieure à la date de génération (%).',
      p_close_date, p_generate_date;
  END IF;

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

  -- GENERATE (daily, weekly tiers excluded) -----------------------------------
  IF p_dry_run THEN
    SELECT count(*) INTO v_generated
    FROM public.member_tontine_categories mtc
    JOIN public.tontine_categories tc ON tc.id = mtc.category_id
    WHERE mtc.is_active = true
      AND tc.is_active = true
      AND tc.frequency = 'daily'
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
        AND tc.frequency = 'daily'
      ON CONFLICT (user_id, category_id, cycle_id, due_date) DO NOTHING
      RETURNING 1
    )
    SELECT count(*) INTO v_generated FROM inserted;
  END IF;

  -- CLOSE (mark overdue) ------------------------------------------------------
  IF p_dry_run THEN
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

REVOKE ALL ON FUNCTION public.run_daily_tontine_maintenance(date, date, boolean) FROM public;
REVOKE ALL ON FUNCTION public.run_daily_tontine_maintenance(date, date, boolean) FROM anon;
REVOKE ALL ON FUNCTION public.run_daily_tontine_maintenance(date, date, boolean) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.run_daily_tontine_maintenance(date, date, boolean) TO service_role;

-- NOTE: No cron.schedule(...) here. Scheduling (weekly cadence) is a separate manual step
-- after end-to-end review and sign-off.
