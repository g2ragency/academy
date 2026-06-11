-- ============================================================
-- POLICY STORAGE per il bucket `academy`
--
-- Il bucket esiste ed è pubblico, ma su storage.objects la RLS
-- è attiva di default senza policy: qualsiasi upload (anche da
-- utente autenticato) fallisce con "new row violates row-level
-- security policy" (403).
--
-- Regole:
--  - lettura pubblica sul bucket (corsi, avatar, materiali)
--  - ogni utente può caricare/aggiornare/eliminare SOLO il
--    proprio avatar: avatars/{user_id}.{ext}
--  - gli admin (is_admin(), vedi 002) gestiscono tutto il bucket
-- ============================================================

-- Lettura pubblica
DROP POLICY IF EXISTS "Public read academy bucket" ON storage.objects;
CREATE POLICY "Public read academy bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'academy');

-- Avatar: upload del proprio file
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'academy'
  AND name LIKE 'avatars/' || auth.uid()::text || '.%'
);

-- Avatar: sovrascrittura (upsert) del proprio file
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'academy'
  AND name LIKE 'avatars/' || auth.uid()::text || '.%'
)
WITH CHECK (
  bucket_id = 'academy'
  AND name LIKE 'avatars/' || auth.uid()::text || '.%'
);

-- Avatar: rimozione del proprio file
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'academy'
  AND name LIKE 'avatars/' || auth.uid()::text || '.%'
);

-- Admin: gestione completa del bucket (copertine corsi, materiali, video, ecc.)
DROP POLICY IF EXISTS "Admins can manage academy bucket" ON storage.objects;
CREATE POLICY "Admins can manage academy bucket"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'academy' AND is_admin())
WITH CHECK (bucket_id = 'academy' AND is_admin());
