-- Harmonize tontine_categories with the official membership tiers.
-- DRAFT — do NOT deploy without manual validation (per project rules).
--
-- Official tiers (WEEKLY amounts):
--   Bronze 5 000 · Silver 10 000 · Gold 25 000 · Diamond 50 000 · Platinium 100 000 · Prestige 200 000 FCFA/semaine
--
-- ⚠️ DAILY vs WEEKLY
-- tontine_categories only had `daily_amount`, and the whole module generates DAILY
-- contributions (generate_daily_tontine_contributions reads daily_amount). The official
-- tier amounts are WEEKLY. Storing a weekly amount directly in daily_amount would charge
-- it every day (×7). Approach used here (least disruptive, reversible):
--   * Add a `weekly_amount` column holding the canonical weekly tier amount (for display).
--   * Keep `daily_amount` as the per-day charge used by the existing daily generation,
--     derived as weekly_amount / 7 so 7 daily contributions sum to the weekly amount.
-- Alternative (NOT done here, larger change): move generation to a weekly cadence.
-- Decide before deploying.

-- 1. Add weekly_amount (additive, nullable, non-breaking; no RLS change).
ALTER TABLE public.tontine_categories
  ADD COLUMN IF NOT EXISTS weekly_amount numeric CHECK (weekly_amount >= 0);

-- 2. Remove legacy categories that are NOT part of the official set AND hold no data.
--    Verified empty at authoring time (0 memberships, 0 contributions): Argent, Or, Diamant.
--    Guarded so the migration never deletes a category that has acquired references.
DELETE FROM public.tontine_categories c
WHERE c.name IN ('Argent', 'Or', 'Diamant')
  AND NOT EXISTS (SELECT 1 FROM public.member_tontine_categories m WHERE m.category_id = c.id)
  AND NOT EXISTS (SELECT 1 FROM public.tontine_contributions t WHERE t.category_id = c.id);

-- 3. Upsert the 6 official tiers. Bronze already exists (and has data) -> updated in place,
--    keeping its id so existing memberships/contributions stay intact.
--    daily_amount = round(weekly_amount / 7, 2) for the existing daily generation.
INSERT INTO public.tontine_categories (name, description, weekly_amount, daily_amount, currency, is_active)
VALUES
  ('Bronze',    'Cotisation de 5 000 FCFA par semaine',   5000,   round(5000   / 7.0, 2), 'FCFA', true),
  ('Silver',    'Cotisation de 10 000 FCFA par semaine',  10000,  round(10000  / 7.0, 2), 'FCFA', true),
  ('Gold',      'Cotisation de 25 000 FCFA par semaine',  25000,  round(25000  / 7.0, 2), 'FCFA', true),
  ('Diamond',   'Cotisation de 50 000 FCFA par semaine',  50000,  round(50000  / 7.0, 2), 'FCFA', true),
  ('Platinium', 'Cotisation de 100 000 FCFA par semaine', 100000, round(100000 / 7.0, 2), 'FCFA', true),
  ('Prestige',  'Cotisation de 200 000 FCFA par semaine', 200000, round(200000 / 7.0, 2), 'FCFA', true)
ON CONFLICT (name) DO UPDATE SET
  description   = EXCLUDED.description,
  weekly_amount = EXCLUDED.weekly_amount,
  daily_amount  = EXCLUDED.daily_amount,
  is_active     = true,
  updated_at    = now();
