-- DRAFT — DO NOT APPLY. Member-status guards for tontine RPCs — preparation only.
-- File: supabase/drafts/20260619_draft_member_status_guards.sql
--
-- STATUS: DRAFT, NOT a migration (lives under supabase/drafts/, never pushed).
-- Apply manually ONLY AFTER 20260619_draft_member_account_status.sql, which creates
-- public.member_account_status and public.current_member_status().
--
-- BUSINESS RULE (final):
--   active    -> allowed everywhere
--   paused    -> payment blocked, selection blocked, generation excluded
--   suspended -> payment blocked, selection blocked, generation excluded
--   banned    -> payment blocked, selection blocked, generation excluded
--   => Only 'active' members may declare a payment, select a category, or be
--      included in contribution generation. Members with NO status row default to
--      'active' (COALESCE), so current behaviour is fully preserved.
--
-- NON-REGRESSION: the function bodies below were regenerated verbatim from the LIVE
--   definitions (pg_get_functiondef) on 2026-06-19; ONLY the guard / LEFT JOIN
--   deltas were added. All other logic (single-active-cycle checks, ON CONFLICT,
--   frequency filters, close branch) is unchanged.
--
-- DOES NOT TOUCH: member_unselect_tontine_category, admin_validate_tontine_payment,
--   close_daily_tontine_contributions, auth.users, user_roles.

-- ===========================================================================
-- 1. member_declare_tontine_payment — block non-active callers
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.member_declare_tontine_payment(
  p_contribution_id uuid,
  p_payment_method_id uuid,
  p_amount numeric,
  p_payment_reference text DEFAULT NULL,
  p_proof_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_user_id uuid;
  v_category_id uuid;
  v_cycle_id uuid;
  v_status text;
  v_payment_id uuid;
BEGIN
  -- Must be authenticated
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Non authentifié.';
  END IF;

  -- GUARD (member status): only 'active' members may declare a payment.
  IF public.current_member_status() <> 'active' THEN
    RAISE EXCEPTION 'MEMBER_RESTRICTED'
      USING MESSAGE = 'Votre compte est temporairement restreint. Contactez l''administration.';
  END IF;

  -- Amount must be strictly positive
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Le montant du paiement doit être strictement positif.';
  END IF;

  -- Fetch the contribution and lock the row for the transaction
  SELECT user_id, category_id, cycle_id, status
    INTO v_user_id, v_category_id, v_cycle_id, v_status
  FROM public.tontine_contributions
  WHERE id = p_contribution_id
  FOR UPDATE;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Cotisation introuvable.';
  END IF;

  -- The contribution must belong to the caller
  IF v_user_id <> v_uid THEN
    RAISE EXCEPTION 'Vous ne pouvez pas déclarer un paiement pour la cotisation d''un autre membre.';
  END IF;

  -- Reject payment on contributions already settled or cancelled
  IF v_status IN ('paid', 'cancelled') THEN
    RAISE EXCEPTION 'Cette cotisation est déjà réglée ou annulée; aucun paiement ne peut être déclaré.';
  END IF;

  -- The payment method must exist and be active
  IF NOT EXISTS (
    SELECT 1 FROM public.payment_methods
    WHERE id = p_payment_method_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Moyen de paiement introuvable ou inactif.';
  END IF;

  -- Insert using values derived from the contribution, not from the caller
  INSERT INTO public.contribution_payments (
    contribution_id, user_id, category_id, cycle_id,
    payment_method_id, amount, payment_reference, proof_url, status
  )
  VALUES (
    p_contribution_id, v_user_id, v_category_id, v_cycle_id,
    p_payment_method_id, p_amount, p_payment_reference, p_proof_url, 'pending'
  )
  RETURNING id INTO v_payment_id;

  RETURN v_payment_id;
END;
$$;

-- ===========================================================================
-- 2. member_select_tontine_category — block non-active callers
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.member_select_tontine_category(p_category_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_is_active boolean;
BEGIN
  -- GUARD (member status): only 'active' members may join a category.
  IF public.current_member_status() <> 'active' THEN
    RAISE EXCEPTION 'MEMBER_RESTRICTED'
      USING MESSAGE = 'Votre compte est temporairement restreint. Contactez l''administration.';
  END IF;

  -- Verify category exists and is active
  SELECT is_active INTO v_is_active FROM public.tontine_categories WHERE id = p_category_id;
  IF v_is_active IS NOT TRUE THEN
    RAISE EXCEPTION 'La catégorie sélectionnée est introuvable ou inactive.';
  END IF;

  INSERT INTO public.member_tontine_categories (user_id, category_id, is_active)
  VALUES (auth.uid(), p_category_id, true)
  ON CONFLICT (user_id, category_id)
  DO UPDATE SET is_active = true, updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ===========================================================================
-- 3. generate_daily_tontine_contributions — exclude non-active members
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.generate_daily_tontine_contributions(p_target_date date)
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
    SELECT mtc.user_id, mtc.category_id, tc.daily_amount
    FROM public.member_tontine_categories mtc
    JOIN public.tontine_categories tc ON mtc.category_id = tc.id
    LEFT JOIN public.member_account_status mas ON mas.user_id = mtc.user_id
    WHERE mtc.is_active = true
      AND tc.is_active = true
      AND tc.frequency = 'daily'   -- SAFETY: weekly tiers are never generated daily
      AND COALESCE(mas.status, 'active') = 'active'   -- GUARD: only active members
  LOOP
    INSERT INTO public.tontine_contributions (
      user_id, category_id, cycle_id, due_date, expected_amount, paid_amount, status
    )
    VALUES (
      r_member.user_id, r_member.category_id, v_active_cycle_id, p_target_date, r_member.daily_amount, 0, 'pending'
    )
    ON CONFLICT (user_id, category_id, cycle_id, due_date) DO NOTHING;

    IF FOUND THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ===========================================================================
-- 4. generate_weekly_tontine_contributions — exclude non-active members
-- ===========================================================================
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
    LEFT JOIN public.member_account_status mas ON mas.user_id = mtc.user_id
    WHERE mtc.is_active = true
      AND tc.is_active = true
      AND tc.frequency = 'weekly'   -- only weekly tiers
      AND COALESCE(mas.status, 'active') = 'active'   -- GUARD: only active members
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

-- ===========================================================================
-- 5. run_daily_tontine_maintenance — exclude non-active members (service_role)
-- ===========================================================================
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

  -- GENERATE (daily, weekly tiers excluded, non-active members excluded) -------
  IF p_dry_run THEN
    SELECT count(*) INTO v_generated
    FROM public.member_tontine_categories mtc
    JOIN public.tontine_categories tc ON tc.id = mtc.category_id
    LEFT JOIN public.member_account_status mas ON mas.user_id = mtc.user_id
    WHERE mtc.is_active = true
      AND tc.is_active = true
      AND tc.frequency = 'daily'
      AND COALESCE(mas.status, 'active') = 'active'   -- GUARD: only active members
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
      LEFT JOIN public.member_account_status mas ON mas.user_id = mtc.user_id
      WHERE mtc.is_active = true
        AND tc.is_active = true
        AND tc.frequency = 'daily'
        AND COALESCE(mas.status, 'active') = 'active'   -- GUARD: only active members
      ON CONFLICT (user_id, category_id, cycle_id, due_date) DO NOTHING
      RETURNING 1
    )
    SELECT count(*) INTO v_generated FROM inserted;
  END IF;

  -- CLOSE (mark overdue) — unchanged ------------------------------------------
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

-- ===========================================================================
-- 6. run_weekly_tontine_maintenance — exclude non-active members (service_role)
-- ===========================================================================
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

  -- GENERATE (weekly, non-active members excluded) ----------------------------
  IF p_dry_run THEN
    SELECT count(*) INTO v_generated
    FROM public.member_tontine_categories mtc
    JOIN public.tontine_categories tc ON tc.id = mtc.category_id
    LEFT JOIN public.member_account_status mas ON mas.user_id = mtc.user_id
    WHERE mtc.is_active = true
      AND tc.is_active = true
      AND tc.frequency = 'weekly'
      AND COALESCE(mas.status, 'active') = 'active'   -- GUARD: only active members
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
      LEFT JOIN public.member_account_status mas ON mas.user_id = mtc.user_id
      WHERE mtc.is_active = true
        AND tc.is_active = true
        AND tc.frequency = 'weekly'
        AND COALESCE(mas.status, 'active') = 'active'   -- GUARD: only active members
      ON CONFLICT (user_id, category_id, cycle_id, due_date) DO NOTHING
      RETURNING 1
    )
    SELECT count(*) INTO v_generated FROM inserted;
  END IF;

  -- CLOSE (mark overdue) — cadence-agnostic, unchanged ------------------------
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

-- NOTE: GRANTs are unchanged. CREATE OR REPLACE keeps existing privileges, so the
-- member RPCs stay authenticated-only and the runners stay service_role-only.
