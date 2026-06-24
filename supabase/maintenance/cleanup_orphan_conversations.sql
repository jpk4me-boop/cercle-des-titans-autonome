-- =============================================================================
-- Nettoyage des conversations orphelines (sans aucun participant)
--
-- Contexte : avant le correctif RPC, chaque tentative de création échouait
-- APRÈS l'INSERT de la conversation (échec du read-back RLS), laissant des
-- lignes `conversations` sans participant ni message.
--
-- ⚠️ Fichier de MAINTENANCE — PAS une migration. À exécuter manuellement dans
--    le SQL Editor, à la demande. NE PAS placer dans migrations/.
--
-- Procédure recommandée :
--   1. Lancer d'abord le SELECT pour inspecter ce qui sera supprimé.
--   2. Vérifier que ces conversations n'ont effectivement ni participant.
--   3. Lancer ensuite le DELETE séparément, en connaissance de cause.
-- =============================================================================

-- 1) INSPECTION — conversations sans aucun participant.
SELECT c.id, c.title, c.created_at, c.last_message_at
FROM public.conversations c
WHERE NOT EXISTS (
  SELECT 1
  FROM public.conversation_participants cp
  WHERE cp.conversation_id = c.id
)
ORDER BY c.created_at DESC;


-- 2) SUPPRESSION — à exécuter SÉPARÉMENT, seulement après validation du SELECT.
--    (Laissé commenté pour éviter toute exécution accidentelle.)
--
-- DELETE FROM public.conversations c
-- WHERE NOT EXISTS (
--   SELECT 1
--   FROM public.conversation_participants cp
--   WHERE cp.conversation_id = c.id
-- );
