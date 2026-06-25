-- =============================================================================
-- Verrouillage messagerie : modèle « boîte commune administration ».
--
-- Règles produit appliquées (côté Supabase, pas seulement côté UI) :
--   * un membre ne communique qu'avec l'administration ;
--   * aucun échange privé membre ↔ membre n'est possible ;
--   * tous les admin/super_admin voient, gèrent et répondent à TOUTES les
--     conversations membres (boîte commune).
--
-- Failles corrigées :
--   1. RPC create_conversation(uuid[], text) acceptait des participants
--      arbitraires → un membre pouvait créer une conversation membre ↔ membre.
--      => SUPPRIMÉE et remplacée par des RPC dédiées.
--   2. conversation_participants INSERT WITH CHECK (user_id = auth.uid())
--      permettait à un membre de S'AUTO-INSÉRER dans n'importe quelle
--      conversation (énumération d'UUID) puis d'en lire tous les messages.
--      => INSERT réservé aux admins.
--   3. Aucune policy admin sur conversations / conversation_participants /
--      messages → les admins ne pouvaient ni lire ni gérer.
--      => accès admin/super_admin ajouté partout.
--
-- ⚠️ NE PAS APPLIQUER en production sans validation manuelle (tests messagerie).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Suppression de la RPC dangereuse (participants arbitraires).
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.create_conversation(uuid[], text);

-- -----------------------------------------------------------------------------
-- 1. Helper : la conversation est-elle « officielle » (≥ 1 participant
--    admin/super_admin) ? SECURITY DEFINER → corps non soumis à la RLS, donc
--    pas de récursion. N'accepte aucun user_id : ne révèle rien d'autre que
--    « cette conversation contient-elle un admin ».
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin_conversation(_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    JOIN public.user_roles ur ON ur.user_id = cp.user_id
    WHERE cp.conversation_id = _conversation_id
      AND ur.role IN ('admin', 'super_admin')
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin_conversation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_conversation(uuid) TO authenticated;

-- -----------------------------------------------------------------------------
-- 2. RPC admin → membre : démarre une conversation officielle.
--    Seul un admin/super_admin peut l'appeler. Inscrit l'admin appelant
--    (auth.uid(), jamais un id passé par le client) + le membre cible, puis
--    insère éventuellement un premier message.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_start_conversation(
  _member_id uuid,
  _content text DEFAULT NULL,
  _title text DEFAULT NULL
)
RETURNS public.conversations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_conversation public.conversations;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_admin_or_super_admin() THEN
    RAISE EXCEPTION 'Only admins can start a conversation';
  END IF;

  IF _member_id IS NULL THEN
    RAISE EXCEPTION 'Member id is required';
  END IF;

  INSERT INTO public.conversations (title)
  VALUES (_title)
  RETURNING * INTO v_conversation;

  -- Admin initiateur + membre cible.
  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES (v_conversation.id, v_uid)
  ON CONFLICT (conversation_id, user_id) DO NOTHING;

  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES (v_conversation.id, _member_id)
  ON CONFLICT (conversation_id, user_id) DO NOTHING;

  -- Premier message éventuel, envoyé par l'admin.
  IF _content IS NOT NULL AND length(trim(_content)) > 0 THEN
    INSERT INTO public.messages (conversation_id, sender_id, content)
    VALUES (v_conversation.id, v_uid, trim(_content));
  END IF;

  RETURN v_conversation;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_start_conversation(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_start_conversation(uuid, text, text) TO authenticated;

-- -----------------------------------------------------------------------------
-- 3. RPC membre → administration : réponse dans une conversation officielle.
--    Le membre ne peut écrire que s'il est participant ET que la conversation
--    contient un admin. Empêche toute injection dans une conversation tierce
--    et tout échange membre ↔ membre. sender_id = auth.uid() (jamais le client).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.member_reply_to_admin(
  _conversation_id uuid,
  _content text
)
RETURNS public.messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_message public.messages;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _content IS NULL OR length(trim(_content)) = 0 THEN
    RAISE EXCEPTION 'Message content is required';
  END IF;

  IF NOT public.is_current_user_conversation_participant(_conversation_id) THEN
    RAISE EXCEPTION 'Not a participant of this conversation';
  END IF;

  IF NOT public.is_admin_conversation(_conversation_id) THEN
    RAISE EXCEPTION 'Conversation is not an official administration conversation';
  END IF;

  INSERT INTO public.messages (conversation_id, sender_id, content)
  VALUES (_conversation_id, v_uid, trim(_content))
  RETURNING * INTO v_message;

  RETURN v_message;
END;
$$;

REVOKE ALL ON FUNCTION public.member_reply_to_admin(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.member_reply_to_admin(uuid, text) TO authenticated;

-- =============================================================================
-- 4. Durcissement RLS (défense en profondeur : protège aussi les appels REST
--    directs, pas seulement le passage par les RPC).
-- =============================================================================

-- ---- conversations ----------------------------------------------------------
-- INSERT : réservé aux admins (le chemin nominal reste la RPC SECURITY DEFINER).
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Admins can create conversations"
ON public.conversations
FOR INSERT
WITH CHECK (public.is_admin_or_super_admin());

-- SELECT : participant OU admin (boîte commune).
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
CREATE POLICY "Users can view conversations they participate in"
ON public.conversations
FOR SELECT
USING (
  public.is_current_user_conversation_participant(id)
  OR public.is_admin_or_super_admin()
);

-- UPDATE : participant OU admin.
DROP POLICY IF EXISTS "Users can update conversations they participate in" ON public.conversations;
CREATE POLICY "Users can update conversations they participate in"
ON public.conversations
FOR UPDATE
USING (
  public.is_current_user_conversation_participant(id)
  OR public.is_admin_or_super_admin()
);

-- DELETE : réservé aux admins (gestion boîte commune ; un membre ne supprime
-- plus de conversation).
DROP POLICY IF EXISTS "Users can delete empty conversations they participate in" ON public.conversations;
CREATE POLICY "Admins can delete conversations"
ON public.conversations
FOR DELETE
USING (public.is_admin_or_super_admin());

-- ---- conversation_participants ----------------------------------------------
-- INSERT : réservé aux admins. FERME LE TROU d'auto-insertion : un membre ne
-- peut plus s'ajouter à une conversation arbitraire.
DROP POLICY IF EXISTS "Users can add themselves as participants" ON public.conversation_participants;
CREATE POLICY "Admins can add participants"
ON public.conversation_participants
FOR INSERT
WITH CHECK (public.is_admin_or_super_admin());

-- SELECT : sa propre ligne OU participant de la conversation OU admin.
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;
CREATE POLICY "Users can view participants of their conversations"
ON public.conversation_participants
FOR SELECT
USING (
  user_id = auth.uid()
  OR public.is_current_user_conversation_participant(conversation_id)
  OR public.is_admin_or_super_admin()
);

-- UPDATE : sa propre ligne (last_read_at) OU admin.
DROP POLICY IF EXISTS "Users can update their own participation" ON public.conversation_participants;
CREATE POLICY "Users can update their own participation"
ON public.conversation_participants
FOR UPDATE
USING (user_id = auth.uid() OR public.is_admin_or_super_admin());

-- DELETE : réservé aux admins (gestion des participants centralisée).
DROP POLICY IF EXISTS "Users can leave conversations" ON public.conversation_participants;
CREATE POLICY "Admins can remove participants"
ON public.conversation_participants
FOR DELETE
USING (public.is_admin_or_super_admin());

-- ---- messages ---------------------------------------------------------------
-- SELECT : participant OU admin.
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations"
ON public.messages
FOR SELECT
USING (
  public.is_current_user_conversation_participant(conversation_id)
  OR public.is_admin_or_super_admin()
);

-- INSERT : admin (peut écrire partout, boîte commune) OU membre participant
-- d'une conversation officielle (contenant un admin). Bloque tout message dans
-- une conversation sans admin → empêche membre ↔ membre.
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;
CREATE POLICY "Users can send messages to their conversations"
ON public.messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND (
    public.is_admin_or_super_admin()
    OR (
      public.is_current_user_conversation_participant(conversation_id)
      AND public.is_admin_conversation(conversation_id)
    )
  )
);

-- UPDATE : son propre message OU admin.
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
CREATE POLICY "Users can update their own messages"
ON public.messages
FOR UPDATE
USING (sender_id = auth.uid() OR public.is_admin_or_super_admin());

-- DELETE : son propre message OU admin.
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;
CREATE POLICY "Users can delete their own messages"
ON public.messages
FOR DELETE
USING (sender_id = auth.uid() OR public.is_admin_or_super_admin());

-- =============================================================================
-- 5. Backfill des conversations existantes (compatibilité ascendante).
--
--   Problème : sans cette étape, les anciennes conversations « membre seul »
--   (créées par l'ancien flux create_conversation([], 'Nouvelle conversation'))
--   n'ont aucun participant admin. Après le verrouillage, leur(s) membre(s)
--   pourrai(en)t encore les LIRE mais plus y écrire (RLS) → fils morts.
--
--   Stratégie SÛRE (n'ouvre jamais d'échange membre ↔ membre) :
--     * conversation SANS admin ET avec UN SEUL participant membre
--         → on y inscrit le super_admin principal. Elle devient une
--           conversation officielle membre ↔ administration. Rien n'est cassé,
--           aucun échange entre membres n'est créé.
--     * conversation SANS admin ET avec PLUSIEURS participants membres
--         → véritable conversation membre ↔ membre : on NE backfill PAS
--           (cela réactiverait l'échange entre membres). Laissée gelée par la
--           RLS (plus aucun message possible). Voir section 6 pour la clôture.
--     * conversation orpheline (0 participant)
--         → ignorée (script supabase/maintenance/cleanup_orphan_conversations.sql).
--
--   Super_admin principal = la plus ancienne attribution (created_at) du rôle
--   'super_admin'. Idempotent : une fois normalisée, la conversation a un admin
--   et ne sera plus reprise.
-- =============================================================================
DO $$
DECLARE
  v_principal uuid;
  v_backfilled integer := 0;
  v_member_to_member integer := 0;
BEGIN
  SELECT user_id INTO v_principal
  FROM public.user_roles
  WHERE role = 'super_admin'
  ORDER BY created_at NULLS LAST, user_id
  LIMIT 1;

  IF v_principal IS NULL THEN
    RAISE NOTICE 'Backfill ignoré : aucun super_admin trouvé dans user_roles.';
  ELSE
    -- Classe chaque participant (admin ou non) UNE seule fois, même si
    -- l'utilisateur cumule plusieurs rôles (EXISTS plutôt qu'un JOIN qui
    -- dédoublerait les comptes).
    WITH participant_class AS (
      SELECT
        cp.conversation_id,
        cp.user_id,
        EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = cp.user_id
            AND ur.role IN ('admin', 'super_admin')
        ) AS is_admin
      FROM public.conversation_participants cp
    ),
    conv_stats AS (
      SELECT
        conversation_id,
        count(*) FILTER (WHERE is_admin)     AS admin_count,
        count(*) FILTER (WHERE NOT is_admin) AS nonadmin_count
      FROM participant_class
      GROUP BY conversation_id
    ),
    targets AS (
      SELECT conversation_id
      FROM conv_stats
      WHERE admin_count = 0
        AND nonadmin_count = 1            -- « membre seul » uniquement
    ),
    ins AS (
      INSERT INTO public.conversation_participants (conversation_id, user_id)
      SELECT conversation_id, v_principal FROM targets
      ON CONFLICT (conversation_id, user_id) DO NOTHING
      RETURNING 1
    )
    SELECT count(*) INTO v_backfilled FROM ins;

    -- Décompte informatif des vraies conversations membre ↔ membre laissées
    -- volontairement sans admin (gelées par la RLS, clôture en section 6).
    WITH participant_class AS (
      SELECT
        cp.conversation_id,
        EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = cp.user_id
            AND ur.role IN ('admin', 'super_admin')
        ) AS is_admin
      FROM public.conversation_participants cp
    )
    SELECT count(*) INTO v_member_to_member
    FROM (
      SELECT conversation_id
      FROM participant_class
      GROUP BY conversation_id
      HAVING count(*) FILTER (WHERE is_admin) = 0
         AND count(*) FILTER (WHERE NOT is_admin) >= 2
    ) m;

    RAISE NOTICE 'Backfill super_admin principal % : % conversation(s) « membre seul » normalisée(s).',
      v_principal, v_backfilled;
    RAISE NOTICE '% conversation(s) membre <-> membre restante(s) sans admin (gelées ; voir section 6).',
      v_member_to_member;
  END IF;
END $$;

-- =============================================================================
-- 6. Conversations membre ↔ membre héritées : clôture MANUELLE (optionnelle).
--
--   Ces conversations (≥ 2 membres, aucun admin) ne peuvent plus recevoir de
--   nouveau message après ce verrouillage (RLS), mais leurs participants
--   peuvent encore lire l'HISTORIQUE existant. Pour appliquer pleinement la
--   règle « aucun membre ne reçoit de message d'un autre membre », purger cet
--   historique. Action DESTRUCTIVE : exécuter manuellement APRÈS revue, jamais
--   automatiquement dans la migration.
--
--   Inspection (à exécuter d'abord) :
--     WITH participant_class AS (
--       SELECT cp.conversation_id,
--              EXISTS (SELECT 1 FROM public.user_roles ur
--                      WHERE ur.user_id = cp.user_id
--                        AND ur.role IN ('admin','super_admin')) AS is_admin
--       FROM public.conversation_participants cp
--     )
--     SELECT conversation_id
--     FROM participant_class
--     GROUP BY conversation_id
--     HAVING count(*) FILTER (WHERE is_admin) = 0
--        AND count(*) FILTER (WHERE NOT is_admin) >= 2;
--
--   Clôture (décommenter et exécuter manuellement si validée) — le CASCADE
--   supprime participants et messages liés :
--     -- DELETE FROM public.conversations c
--     -- WHERE c.id IN (
--     --   WITH participant_class AS (
--     --     SELECT cp.conversation_id,
--     --            EXISTS (SELECT 1 FROM public.user_roles ur
--     --                    WHERE ur.user_id = cp.user_id
--     --                      AND ur.role IN ('admin','super_admin')) AS is_admin
--     --     FROM public.conversation_participants cp
--     --   )
--     --   SELECT conversation_id
--     --   FROM participant_class
--     --   GROUP BY conversation_id
--     --   HAVING count(*) FILTER (WHERE is_admin) = 0
--     --      AND count(*) FILTER (WHERE NOT is_admin) >= 2
--     -- );
-- =============================================================================
