-- Harmonize tontine_categories with the official WEEKLY membership tiers.
-- DRAFT — do NOT deploy without manual validation (per project rules).
--
-- Official tiers (WEEKLY amounts, integer FCFA — no decimals):
--   Bronze 5 000 · Silver 10 000 · Gold 25 000 · Diamond 50 000 · Platinium 100 000 · Prestige 200 000 FCFA/semaine
--
-- Pre-flight checks (validated 2026-06-17 against live DB):
--   Argent  : 0 membership, 0 contribution, 0 payment  -> safe to delete
--   Or      : 0 membership, 0 contribution, 0 payment  -> safe to delete
--   Diamant : 0 membership, 0 contribution, 0 payment  -> safe to delete
--   Bronze  : 3 memberships, 1 contribution, 0 payment -> KEEP (updated in place, id preserved)
--
-- MODEL: weekly_amount is the official integer amount (source of truth). frequency='weekly'.
-- We do NOT derive daily_amount = weekly_amount / 7 (that produced FCFA decimals like 714.29).
-- daily_amount is LEGACY for weekly tiers: set = weekly_amount only to satisfy its NOT NULL
-- constraint; weekly generation reads weekly_amount, never daily_amount.
--
-- SAFETY: this migration also locks the legacy DAILY generator so that no 'weekly' category
-- can ever be charged daily (see step 4). The weekly generator/runner live in the next
-- migration (20260616140000_create_tontine_weekly_functions.sql).

-- 1. Columns -----------------------------------------------------------------
-- weekly_amount: integer FCFA only (CHECK forbids decimals).
ALTER TABLE public.tontine_categories
  ADD COLUMN IF NOT EXISTS weekly_amount numeric
    CHECK (weekly_amount >= 0 AND weekly_amount = trunc(weekly_amount));

-- frequency: 'daily' (legacy) | 'weekly' (official). Default 'weekly'.
ALTER TABLE public.tontine_categories
  ADD COLUMN IF NOT EXISTS frequency text NOT NULL DEFAULT 'weekly'
    CHECK (frequency IN ('daily', 'weekly'));

-- 2. Remove legacy categories ONLY if they hold no data at all -----------------
--    Triple guard: 0 memberships AND 0 contributions AND 0 payments.
DELETE FROM public.tontine_categories c
WHERE c.name IN ('Argent', 'Or', 'Diamant')
  AND NOT EXISTS (SELECT 1 FROM public.member_tontine_categories m WHERE m.category_id = c.id)
  AND NOT EXISTS (SELECT 1 FROM public.tontine_contributions    t WHERE t.category_id = c.id)
  AND NOT EXISTS (SELECT 1 FROM public.contribution_payments    p WHERE p.category_id = c.id);

-- 3. Upsert the 6 official tiers ----------------------------------------------
--    Bronze matched by UNIQUE(name) -> updated in place, id preserved, references intact.
--    weekly_amount = official integer ; daily_amount = weekly_amount (legacy, no decimals) ; frequency='weekly'.
INSERT INTO public.tontine_categories (name, description, weekly_amount, daily_amount, frequency, currency, is_active)
VALUES
  ('Bronze',    'Cotisation de 5 000 FCFA par semaine',   5000,   5000,   'weekly', 'FCFA', true),
  ('Silver',    'Cotisation de 10 000 FCFA par semaine',  10000,  10000,  'weekly', 'FCFA', true),
  ('Gold',      'Cotisation de 25 000 FCFA par semaine',  25000,  25000,  'weekly', 'FCFA', true),
  ('Diamond',   'Cotisation de 50 000 FCFA par semaine',  50000,  50000,  'weekly', 'FCFA', true),
  ('Platinium', 'Cotisation de 100 000 FCFA par semaine', 100000, 100000, 'weekly', 'FCFA', true),
  ('Prestige',  'Cotisation de 200 000 FCFA par semaine', 200000, 200000, 'weekly', 'FCFA', true)
ON CONFLICT (name) DO UPDATE SET
  description   = EXCLUDED.description,
  weekly_amount = EXCLUDED.weekly_amount,
  daily_amount  = EXCLUDED.daily_amount,
  frequency     = EXCLUDED.frequency,
  is_active     = true,
  updated_at    = now();

-- 4. Neutralize the legacy DAILY generator ------------------------------------
--    Same body as the original generate_daily_tontine_contributions, with an added
--    `tc.frequency = 'daily'` filter. After harmonization every official tier is 'weekly',
--    so this generator becomes a safe no-op and can never charge a weekly category per day.
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
    WHERE mtc.is_active = true
      AND tc.is_active = true
      AND tc.frequency = 'daily'   -- SAFETY: weekly tiers are never generated daily
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
