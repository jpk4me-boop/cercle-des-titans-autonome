-- =============================================================================
-- RPC : création atomique d'une conversation + participants
--
-- Contexte : le flux front faisait un INSERT sur conversations suivi d'un
-- read-back (.select() => RETURNING). La policy SELECT de conversations exige
-- d'être déjà participant ; or le participant n'est inséré qu'après. Le
-- RETURNING était donc filtré (403 / 0 ligne), faisant échouer la création.
--
-- Solution : une fonction SECURITY DEFINER crée la conversation, inscrit le
-- créateur (toujours) et les participants éventuels, puis renvoie la
-- conversation — le tout dans une seule transaction, sans dépendre du
-- read-back RLS côté client.
--
-- Sécurité :
--  * exécute avec auth.uid() comme créateur (jamais un id passé par le client) ;
--  * n'ajoute des participants qu'à une conversation NEUVE qu'on vient de créer
--    (aucune injection possible dans une conversation existante) ;
--  * les policies de confidentialité existantes restent inchangées.
--
-- ⚠️ NE PAS APPLIQUER sans validation manuelle.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.create_conversation(
  _participant_ids uuid[] DEFAULT '{}',
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
  v_participant uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.conversations (title)
  VALUES (_title)
  RETURNING * INTO v_conversation;

  -- Le créateur est toujours participant.
  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES (v_conversation.id, v_uid)
  ON CONFLICT (conversation_id, user_id) DO NOTHING;

  -- Participants supplémentaires éventuels (hors créateur, dédupliqués).
  IF _participant_ids IS NOT NULL THEN
    FOREACH v_participant IN ARRAY _participant_ids LOOP
      IF v_participant IS DISTINCT FROM v_uid THEN
        INSERT INTO public.conversation_participants (conversation_id, user_id)
        VALUES (v_conversation.id, v_participant)
        ON CONFLICT (conversation_id, user_id) DO NOTHING;
      END IF;
    END LOOP;
  END IF;

  RETURN v_conversation;
END;
$$;

REVOKE ALL ON FUNCTION public.create_conversation(uuid[], text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_conversation(uuid[], text) TO authenticated;
