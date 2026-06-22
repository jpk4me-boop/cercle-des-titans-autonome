-- Migration : bucket Storage `avatars` pour les photos de profil membres
-- Objectif (Phase A0) : crÃ©er l'infrastructure de stockage des avatars.
--   * lecture publique des avatars ;
--   * upload / update / delete autorisÃ©s UNIQUEMENT dans le dossier de
--     l'utilisateur connectÃ© (premier segment du chemin = son auth.uid()).
--
-- NB : on NE touche PAS Ã  la table profiles (la colonne avatar_url existe dÃ©jÃ ).
-- NB : on NE touche PAS aux tontines / paiements / Edge Functions.
-- Convention de chemin attendue cÃ´tÃ© front : `{auth.uid()}/{fichier}`.

-- 1) CrÃ©ation du bucket (idempotent). `public = true` => lecture publique des objets.
--    file_size_limit (2 Mo) et allowed_mime_types : garde-fous sobres pour des avatars.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2 Mo
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2) Policies sur storage.objects (la RLS y est dÃ©jÃ  activÃ©e par Supabase).
--    On DROP avant CREATE pour rendre la migration rÃ©-exÃ©cutable sans erreur.

-- 2a) Lecture publique : n'importe qui peut lire les fichiers du bucket `avatars`.
DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
CREATE POLICY "Avatars are publicly readable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- 2b) Upload : un utilisateur authentifiÃ© ne peut Ã©crire QUE dans son propre dossier.
--     (storage.foldername(name))[1] = premier segment du chemin = doit valoir son uid.
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2c) Update : un utilisateur ne peut modifier QUE les fichiers de son dossier.
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2d) Delete : un utilisateur ne peut supprimer QUE les fichiers de son dossier.
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

