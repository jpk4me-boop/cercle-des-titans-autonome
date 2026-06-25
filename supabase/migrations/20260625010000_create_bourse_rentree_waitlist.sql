-- =============================================================================
-- Phase B2S-2 — Liste d'attente « Bourse Rentrée Titans 2026 ».
--
-- Objectif : collecter l'intérêt des visiteurs (coordonnées + formule) AVANT
-- l'ouverture officielle. AUCUN paiement, AUCUNE cotisation, AUCUNE inscription
-- au cycle, AUCUN bonus, AUCUNE génération de contributions.
--
-- Sécurité / RLS (policies directes) :
--   * RLS ACTIVÉE ;
--   * INSERT : anon + authenticated, UNIQUEMENT si consent=true et status='new',
--     et user_id NULL ou = auth.uid() (anti-usurpation) ;
--   * SELECT / UPDATE / DELETE : admin/super_admin via is_admin_or_super_admin() ;
--   * AUCUN accès public en lecture ;
--   * AUCUNE policy existante d'aucune autre table n'est modifiée.
--
-- ⚠️ NE PAS APPLIQUER en production sans validation manuelle (SQL Editor).
-- =============================================================================

-- 1. Table -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bourse_rentree_waitlist (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     text NOT NULL,
  phone         text NOT NULL,
  email         text,
  city          text,
  plan_interest text NOT NULL,
  message       text,
  consent       boolean NOT NULL DEFAULT false,
  status        text NOT NULL DEFAULT 'new',
  user_id       uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT bourse_waitlist_full_name_len CHECK (char_length(btrim(full_name)) >= 2),
  CONSTRAINT bourse_waitlist_phone_len     CHECK (char_length(btrim(phone)) >= 6),
  CONSTRAINT bourse_waitlist_email_format  CHECK (
    email IS NULL OR email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  ),
  CONSTRAINT bourse_waitlist_consent_true  CHECK (consent = true),
  CONSTRAINT bourse_waitlist_plan_valid    CHECK (
    plan_interest IN ('serenite', 'excellence', 'prestige_scolaire', 'undecided')
  ),
  CONSTRAINT bourse_waitlist_status_valid  CHECK (
    status IN ('new', 'contacted', 'converted', 'declined', 'archived')
  )
);

-- Anti-doublon souple : un même téléphone ne s'inscrit qu'une fois par formule.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_bourse_waitlist_phone_plan
  ON public.bourse_rentree_waitlist (phone, plan_interest);

-- Index de tri admin (liste récente).
CREATE INDEX IF NOT EXISTS idx_bourse_waitlist_created
  ON public.bourse_rentree_waitlist (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bourse_waitlist_status
  ON public.bourse_rentree_waitlist (status);

-- 2. Trigger updated_at (fonction dédiée, sans collision) --------------------
CREATE OR REPLACE FUNCTION public.touch_bourse_rentree_waitlist_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bourse_waitlist_updated_at ON public.bourse_rentree_waitlist;
CREATE TRIGGER trg_bourse_waitlist_updated_at
  BEFORE UPDATE ON public.bourse_rentree_waitlist
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_bourse_rentree_waitlist_updated_at();

-- 3. RLS ---------------------------------------------------------------------
ALTER TABLE public.bourse_rentree_waitlist ENABLE ROW LEVEL SECURITY;

-- Idempotence : on supprime d'abord les policies si elles existent, pour pouvoir
-- réexécuter ce script sans erreur (CREATE POLICY n'a pas de IF NOT EXISTS).
DROP POLICY IF EXISTS "bourse_waitlist_insert_public" ON public.bourse_rentree_waitlist;
DROP POLICY IF EXISTS "bourse_waitlist_select_admin" ON public.bourse_rentree_waitlist;
DROP POLICY IF EXISTS "bourse_waitlist_update_admin" ON public.bourse_rentree_waitlist;
DROP POLICY IF EXISTS "bourse_waitlist_delete_admin" ON public.bourse_rentree_waitlist;

-- INSERT public conditionnel (anon + authenticated).
CREATE POLICY "bourse_waitlist_insert_public"
  ON public.bourse_rentree_waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    consent = true
    AND status = 'new'
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- SELECT admin uniquement.
CREATE POLICY "bourse_waitlist_select_admin"
  ON public.bourse_rentree_waitlist
  FOR SELECT
  TO authenticated
  USING (public.is_admin_or_super_admin());

-- UPDATE admin uniquement.
CREATE POLICY "bourse_waitlist_update_admin"
  ON public.bourse_rentree_waitlist
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_super_admin())
  WITH CHECK (public.is_admin_or_super_admin());

-- DELETE admin uniquement.
CREATE POLICY "bourse_waitlist_delete_admin"
  ON public.bourse_rentree_waitlist
  FOR DELETE
  TO authenticated
  USING (public.is_admin_or_super_admin());

-- 4. Grants (la RLS reste la barrière sur les lignes) ------------------------
REVOKE ALL ON public.bourse_rentree_waitlist FROM PUBLIC;
GRANT INSERT ON public.bourse_rentree_waitlist TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.bourse_rentree_waitlist TO authenticated;
