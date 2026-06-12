-- ============================================================
-- 005: Bucket PRIVATO `academy-media` per i contenuti protetti
--      delle lezioni (video e PDF).
--
-- Il bucket `academy` resta pubblico per thumbnail e avatar.
-- I video/PDF delle lezioni caricati dall'admin vanno in
-- `academy-media`: niente lettura pubblica, l'utente iscritto
-- genera un signed URL dal proprio client (la RLS sotto verifica
-- l'enrollment sul corso ricavato dal path).
--
-- Path: courses/{courseId}/lessons/{lessonId}/video.{ext} | doc.pdf
--        → (storage.foldername(name))[2] = courseId
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('academy-media', 'academy-media', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Admin: gestione completa
DROP POLICY IF EXISTS "Admins manage academy-media" ON storage.objects;
CREATE POLICY "Admins manage academy-media"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'academy-media' AND is_admin())
WITH CHECK (bucket_id = 'academy-media' AND is_admin());

-- Utenti iscritti: lettura (necessaria anche per createSignedUrl)
-- dei media del corso a cui sono iscritti, o delle lezioni anteprima.
DROP POLICY IF EXISTS "Enrolled users read lesson media" ON storage.objects;
CREATE POLICY "Enrolled users read lesson media"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'academy-media'
  AND (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.user_id = auth.uid()
        AND e.status = 'active'
        AND e.course_id::text = (storage.foldername(name))[2]
    )
    OR EXISTS (
      SELECT 1 FROM public.lessons l
      WHERE l.is_preview
        AND (l.video_url = name OR l.pdf_url = name)
    )
  )
);
