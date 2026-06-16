-- SQL Migration for Tontines & Contributions Module (Phase 1)
-- File: supabase/migrations/create_tontine_contributions_module.sql

-- 0. Helper functions for Role check
CREATE OR REPLACE FUNCTION public.is_admin_or_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'super_admin'
  );
END;
$$;

-- 1. Create tontine_categories table
CREATE TABLE IF NOT EXISTS public.tontine_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  daily_amount numeric NOT NULL CHECK (daily_amount >= 0),
  currency text NOT NULL DEFAULT 'FCFA',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create member_tontine_categories table
CREATE TABLE IF NOT EXISTS public.member_tontine_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.tontine_categories(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  joined_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_category UNIQUE (user_id, category_id)
);

-- 3. Create/Alter tontine_cycles table
CREATE TABLE IF NOT EXISTS public.tontine_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.tontine_cycles ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.tontine_cycles ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.tontine_cycles ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE public.tontine_cycles ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE public.tontine_cycles ADD COLUMN IF NOT EXISTS status text DEFAULT 'planned';
ALTER TABLE public.tontine_cycles ADD COLUMN IF NOT EXISTS contribution_amount numeric DEFAULT 0;
ALTER TABLE public.tontine_cycles ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.tontine_cycles ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.tontine_cycles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ADD COLUMN IF NOT EXISTS does not change the default of a pre-existing column,
-- so set it explicitly to align with the app convention ('planned').
ALTER TABLE public.tontine_cycles ALTER COLUMN status SET DEFAULT 'planned';

-- Defense in depth: enforce at most one active cycle via a partial unique index.
-- Created conditionally so the migration NEVER aborts if legacy data already holds
-- more than one active cycle; in that case we only emit a notice.
DO $$
DECLARE
  v_active_count integer;
BEGIN
  SELECT count(*) INTO v_active_count
  FROM public.tontine_cycles
  WHERE status = 'active';

  IF v_active_count <= 1 THEN
    CREATE UNIQUE INDEX IF NOT EXISTS uniq_one_active_tontine_cycle
      ON public.tontine_cycles (status)
      WHERE status = 'active';
  ELSE
    RAISE NOTICE 'Index actif-unique ignoré: % cycles actifs existent déjà. Résolvez les doublons puis créez l''index manuellement.', v_active_count;
  END IF;
END;
$$;

-- 4. Create payment_methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('cash', 'mobile_money', 'bank_transfer', 'card', 'other')),
  provider text,
  instructions text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Create tontine_contributions table
CREATE TABLE IF NOT EXISTS public.tontine_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.tontine_categories(id) ON DELETE CASCADE,
  cycle_id uuid REFERENCES public.tontine_cycles(id) ON DELETE CASCADE,
  due_date date NOT NULL,
  expected_amount numeric NOT NULL CHECK (expected_amount >= 0),
  paid_amount numeric NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_category_cycle_date UNIQUE (user_id, category_id, cycle_id, due_date)
);

-- 6. Create contribution_payments table
CREATE TABLE IF NOT EXISTS public.contribution_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contribution_id uuid NOT NULL REFERENCES public.tontine_contributions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.tontine_categories(id) ON DELETE CASCADE,
  cycle_id uuid REFERENCES public.tontine_cycles(id) ON DELETE CASCADE,
  payment_method_id uuid REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  payment_reference text,
  payment_date timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'rejected')),
  proof_url text,
  admin_note text,
  validated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  validated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Create contribution_reminders table
CREATE TABLE IF NOT EXISTS public.contribution_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contribution_id uuid REFERENCES public.tontine_contributions(id) ON DELETE CASCADE,
  reminder_date date NOT NULL,
  scheduled_at timestamptz NOT NULL,
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'failed', 'skipped')),
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Create indexes for optimization
CREATE INDEX IF NOT EXISTS idx_member_tontine_categories_user ON public.member_tontine_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_tontine_contributions_user_date ON public.tontine_contributions(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tontine_contributions_status ON public.tontine_contributions(status);
CREATE INDEX IF NOT EXISTS idx_contribution_payments_contrib ON public.contribution_payments(contribution_id);
CREATE INDEX IF NOT EXISTS idx_contribution_payments_user ON public.contribution_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_contribution_reminders_user_status ON public.contribution_reminders(user_id, status);

-- 9. Enable Row Level Security (RLS)
ALTER TABLE public.tontine_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_tontine_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tontine_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tontine_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contribution_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contribution_reminders ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies

-- Tontine Categories
CREATE POLICY "Allow select categories for authenticated users" ON public.tontine_categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow all categories for super admins" ON public.tontine_categories
  FOR ALL TO authenticated USING (public.is_super_admin());

-- Member Tontine Categories
-- NOTE: explicit per-command policies. A broad FOR ALL policy is intentionally
-- avoided here because it would OR-combine with (and thereby weaken) the strict
-- INSERT check that requires the category to be active.
CREATE POLICY "Allow select member categories for self or admin" ON public.member_tontine_categories
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin_or_super_admin());

-- INSERT: owner only, and the target category must be active.
CREATE POLICY "Allow insert member categories for owner active category" ON public.member_tontine_categories
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.tontine_categories WHERE id = category_id AND is_active = true
    )
  );

-- UPDATE: owner or admin. The WITH CHECK keeps the active-category rule for the
-- owner so a member cannot repoint their membership to an inactive category.
CREATE POLICY "Allow update member categories for self or admin" ON public.member_tontine_categories
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin_or_super_admin())
  WITH CHECK (
    public.is_admin_or_super_admin()
    OR (
      auth.uid() = user_id
      AND EXISTS (
        SELECT 1 FROM public.tontine_categories WHERE id = category_id AND is_active = true
      )
    )
  );

-- DELETE: owner or admin.
CREATE POLICY "Allow delete member categories for self or admin" ON public.member_tontine_categories
  FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.is_admin_or_super_admin());

-- Tontine Cycles
CREATE POLICY "Allow select cycles for authenticated users" ON public.tontine_cycles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow all cycles for admins" ON public.tontine_cycles
  FOR ALL TO authenticated USING (public.is_admin_or_super_admin());

-- Payment Methods
CREATE POLICY "Allow select payment methods for authenticated users" ON public.payment_methods
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow all payment methods for super admins" ON public.payment_methods
  FOR ALL TO authenticated USING (public.is_super_admin());

-- Tontine Contributions
CREATE POLICY "Allow select contributions for self or admin" ON public.tontine_contributions
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin_or_super_admin());

CREATE POLICY "Allow all contributions for admins" ON public.tontine_contributions
  FOR ALL TO authenticated USING (public.is_admin_or_super_admin());

-- Contribution Payments
-- NOTE: members do NOT get a direct INSERT policy. A self-INSERT policy would only
-- be able to check user_id, not that contribution_id actually belongs to the member,
-- so a member could attach a payment to another member's contribution. Member
-- inserts must go through the SECURITY DEFINER RPC member_declare_tontine_payment,
-- which derives user_id/category_id/cycle_id from the contribution itself.
CREATE POLICY "Allow select payments for self or admin" ON public.contribution_payments
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin_or_super_admin());

CREATE POLICY "Allow all payments for admins" ON public.contribution_payments
  FOR ALL TO authenticated USING (public.is_admin_or_super_admin());

-- Contribution Reminders
CREATE POLICY "Allow select reminders for self or admin" ON public.contribution_reminders
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin_or_super_admin());

CREATE POLICY "Allow all reminders for admins" ON public.contribution_reminders
  FOR ALL TO authenticated USING (public.is_admin_or_super_admin());

-- 11. RPC Functions

-- Select category
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

-- Unselect category
CREATE OR REPLACE FUNCTION public.member_unselect_tontine_category(p_category_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.member_tontine_categories
  SET is_active = false, updated_at = now()
  WHERE user_id = auth.uid() AND category_id = p_category_id;
  
  RETURN FOUND;
END;
$$;

-- Member declares a payment for one of THEIR OWN contributions.
-- Security: SECURITY DEFINER. user_id/category_id/cycle_id are derived from the
-- contribution row, never from the caller, so a member cannot attach a payment
-- to another member's contribution.
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
  -- Check permissions using helper
  IF NOT public.is_admin_or_super_admin() THEN
    RAISE EXCEPTION 'Non autorisé. Droits administrateur requis.';
  END IF;

  -- Require exactly one active cycle. With several active cycles, a blind LIMIT 1
  -- would pick an arbitrary one, so we fail explicitly instead.
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

  -- Loop over all active member categories
  FOR r_member IN 
    SELECT mtc.user_id, mtc.category_id, tc.daily_amount
    FROM public.member_tontine_categories mtc
    JOIN public.tontine_categories tc ON mtc.category_id = tc.id
    WHERE mtc.is_active = true AND tc.is_active = true
  LOOP
    -- Insert if not already exists
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

-- Validate payment (validated_by is fetched from auth.uid() server-side)
CREATE OR REPLACE FUNCTION public.admin_validate_tontine_payment(
  p_payment_id uuid,
  p_status text,
  p_admin_note text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contrib_id uuid;
  v_amount numeric;
  v_expected numeric;
  v_paid_so_far numeric;
  v_new_status text;
BEGIN
  -- Check permissions using helper
  IF NOT public.is_admin_or_super_admin() THEN
    RAISE EXCEPTION 'Non autorisé. Droits administrateur requis.';
  END IF;

  -- Verify valid payment status
  IF p_status NOT IN ('paid', 'rejected', 'pending') THEN
    RAISE EXCEPTION 'Statut de paiement invalide. Doit être paid, rejected ou pending.';
  END IF;

  -- Update payment record - validated_by uses auth.uid() directly
  UPDATE public.contribution_payments
  SET 
    status = p_status,
    admin_note = p_admin_note,
    validated_by = auth.uid(),
    validated_at = now(),
    updated_at = now()
  WHERE id = p_payment_id
  RETURNING contribution_id, amount INTO v_contrib_id, v_amount;

  IF v_contrib_id IS NULL THEN
    RAISE EXCEPTION 'Paiement introuvable.';
  END IF;

  -- Calculate total paid amount for this contribution from all APPROVED (status='paid') payments
  SELECT COALESCE(SUM(amount), 0) INTO v_paid_so_far
  FROM public.contribution_payments
  WHERE contribution_id = v_contrib_id AND status = 'paid';

  -- Get expected amount
  SELECT expected_amount INTO v_expected
  FROM public.tontine_contributions
  WHERE id = v_contrib_id;

  -- Determine new contribution status
  IF v_paid_so_far >= v_expected THEN
    v_new_status := 'paid';
  ELSIF v_paid_so_far > 0 THEN
    v_new_status := 'partial';
  ELSE
    v_new_status := 'pending';
  END IF;

  -- Update the contribution
  UPDATE public.tontine_contributions
  SET 
    paid_amount = v_paid_so_far,
    status = v_new_status,
    updated_at = now()
  WHERE id = v_contrib_id;

  RETURN true;
END;
$$;

-- Close daily contributions (move unpaid/partial past target date to overdue)
CREATE OR REPLACE FUNCTION public.close_daily_tontine_contributions(p_target_date date)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  -- Check permissions using helper
  IF NOT public.is_admin_or_super_admin() THEN
    RAISE EXCEPTION 'Non autorisé. Droits administrateur requis.';
  END IF;

  -- Update contributions that are pending/partial and past their due date to overdue
  UPDATE public.tontine_contributions
  SET 
    status = 'overdue',
    updated_at = now()
  WHERE due_date <= p_target_date 
    AND status IN ('pending', 'partial')
    AND paid_amount < expected_amount;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- 12. RPC Grants
REVOKE ALL ON FUNCTION public.member_select_tontine_category(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.member_select_tontine_category(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.member_unselect_tontine_category(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.member_unselect_tontine_category(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.member_declare_tontine_payment(uuid, uuid, numeric, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.member_declare_tontine_payment(uuid, uuid, numeric, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.generate_daily_tontine_contributions(date) FROM public;
GRANT EXECUTE ON FUNCTION public.generate_daily_tontine_contributions(date) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_validate_tontine_payment(uuid, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_validate_tontine_payment(uuid, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.close_daily_tontine_contributions(date) FROM public;
GRANT EXECUTE ON FUNCTION public.close_daily_tontine_contributions(date) TO authenticated;

-- 13. Minimal Seed Data

-- Seed categories
INSERT INTO public.tontine_categories (name, description, daily_amount, currency, is_active)
VALUES 
  ('Bronze', 'Cotisation de 1 000 FCFA par jour', 1000, 'FCFA', true),
  ('Argent', 'Cotisation de 2 000 FCFA par jour', 2000, 'FCFA', true),
  ('Or', 'Cotisation de 5 000 FCFA par jour', 5000, 'FCFA', true),
  ('Diamant', 'Cotisation de 10 000 FCFA par jour', 10000, 'FCFA', true)
ON CONFLICT (name) DO NOTHING;

-- Seed payment methods
INSERT INTO public.payment_methods (name, type, provider, instructions, is_active)
VALUES
  ('Orange Money', 'mobile_money', 'Orange', 'Transfert au +237 691 849 494', true),
  ('MTN Mobile Money', 'mobile_money', 'MTN', 'Transfert au +237 672 482 763', true),
  ('Espèces', 'cash', 'Cercle des Titans', 'Remise directe en mains propres', true),
  ('Virement bancaire', 'bank_transfer', 'Banque Populaire', 'RIB: 12345 67890 12345678901 23', true)
ON CONFLICT (name) DO NOTHING;
