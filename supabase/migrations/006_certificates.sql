-- ============================================================
-- 006: Attestati di completamento corso
--
-- - flag `courses.issues_certificate` (gestito dall'admin)
-- - tabella `certificates` (sola lettura per l'utente; nessuna
--   scrittura da client)
-- - RPC `issue_certificate` SECURITY DEFINER: verifica enrollment
--   attivo + 100% lezioni completate (i quiz risultano completati
--   solo se superati) e emette l'attestato con numero progressivo.
--   Chiamata lazy dalla pagina /dashboard/attestati.
-- ============================================================

ALTER TABLE courses ADD COLUMN IF NOT EXISTS issues_certificate BOOLEAN NOT NULL DEFAULT FALSE;

CREATE SEQUENCE IF NOT EXISTS certificate_number_seq;

CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  certificate_number TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, course_id)
);
CREATE INDEX idx_certificates_user ON certificates(user_id);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own certificates" ON certificates
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
-- Nessuna policy INSERT/UPDATE/DELETE: scritture solo via funzione SECURITY DEFINER

CREATE OR REPLACE FUNCTION public.issue_certificate(p_course_id UUID)
RETURNS public.certificates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_total INT;
  v_done INT;
  v_cert certificates;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Non autenticato';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM courses WHERE id = p_course_id AND issues_certificate) THEN
    RAISE EXCEPTION 'Questo corso non rilascia attestati';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM enrollments
    WHERE user_id = v_user AND course_id = p_course_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Iscrizione non attiva';
  END IF;

  SELECT COUNT(*) INTO v_total FROM lessons WHERE course_id = p_course_id;
  SELECT COUNT(*) INTO v_done
    FROM lesson_progress
    WHERE user_id = v_user AND course_id = p_course_id AND completed;

  IF v_total = 0 OR v_done < v_total THEN
    RAISE EXCEPTION 'Corso non ancora completato (% di % lezioni)', v_done, v_total;
  END IF;

  -- idempotente: se esiste già, restituisce l'attestato esistente
  SELECT * INTO v_cert FROM certificates WHERE user_id = v_user AND course_id = p_course_id;
  IF FOUND THEN
    RETURN v_cert;
  END IF;

  INSERT INTO certificates (user_id, course_id, certificate_number)
  VALUES (
    v_user,
    p_course_id,
    'AC-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('certificate_number_seq')::text, 6, '0')
  )
  ON CONFLICT (user_id, course_id) DO NOTHING
  RETURNING * INTO v_cert;

  IF v_cert.id IS NULL THEN
    SELECT * INTO v_cert FROM certificates WHERE user_id = v_user AND course_id = p_course_id;
  END IF;
  RETURN v_cert;
END $$;

REVOKE ALL ON FUNCTION public.issue_certificate(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.issue_certificate(UUID) TO authenticated;
