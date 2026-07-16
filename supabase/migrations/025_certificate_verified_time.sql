-- Crediti FPC — ATTESTATO SUL TEMPO VERIFICATO + chiusura buco durata.
--
-- Tre cose, legate dallo stesso principio (sui corsi accreditati decide il
-- server, mai il client):
--
-- 1) BUCO CHIUSO: `lesson_completed_verified` per un video SENZA durata
--    ricadeva sul flag `lesson_progress.completed`, che l'utente può scrivere
--    direttamente (upsert RLS). Su un corso accreditato ciò permetteva di
--    falsificare il completamento di quella lezione → sblocco della successiva
--    e riga "maturato" nel tracciato senza aver guardato nulla.
--    Ora: video senza durata su corso accreditato → MAI verificato (FALSE).
--    Sui corsi non accreditati resta il flag (è solo gamification).
--
-- 2) IGIENE ADMIN: non si può accendere `fpc_accredited` se una lezione video
--    del corso non ha la durata (trigger). Insieme al punto 1: se una lezione
--    senza durata viene aggiunta DOPO l'accreditamento, non è un buco ma un
--    blocco visibile (gli utenti si fermano lì e l'admin corregge la durata).
--
-- 3) SOGLIA ATTESTATO SUL TEMPO (planning §7.7): sui corsi accreditati
--    l'attestato richiede il completamento VERIFICATO di tutti i contenuti
--    (tempo netto dai log ≥ 95% della durata, quiz superato) + test finale se
--    richiesto — lo stesso criterio del `maturato` del tracciato, così
--    attestato e crediti non possono divergere. Sui corsi non accreditati
--    resta la % di lezioni completate (gamification, soglia configurabile).

-- ── 1) lesson_completed_verified v2 ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.lesson_completed_verified(p_user UUID, p_lesson_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN l.type = 'video' AND COALESCE(l.duration_seconds, 0) > 0 THEN
      COALESCE((
        SELECT SUM(t.seconds_credited) FROM learning_time_log t
         WHERE t.user_id = p_user AND t.lesson_id = p_lesson_id
      ), 0) >= l.duration_seconds * 0.95   -- tolleranza 5% (da confermare con l'Ordine)
    WHEN l.type = 'video' THEN
      -- Video senza durata: sul corso accreditato NON è mai verificabile
      -- (il fallback sul flag client era falsificabile); altrove resta il flag.
      CASE WHEN c.fpc_accredited THEN FALSE
           ELSE COALESCE((
             SELECT p.completed FROM lesson_progress p
              WHERE p.user_id = p_user AND p.lesson_id = p_lesson_id
           ), FALSE)
      END
    WHEN l.type = 'quiz' THEN
      EXISTS (
        SELECT 1 FROM quiz_attempts qa
         WHERE qa.user_id = p_user AND qa.lesson_id = p_lesson_id AND qa.passed
      )
    ELSE
      -- pdf/testo: il flag è l'unico segnale esistente (bottone "segna come
      -- completata"). Non genera tempo, quindi non gonfia i crediti.
      COALESCE((
        SELECT p.completed FROM lesson_progress p
         WHERE p.user_id = p_user AND p.lesson_id = p_lesson_id
      ), FALSE)
  END
  FROM lessons l
  JOIN courses c ON c.id = l.course_id
  WHERE l.id = p_lesson_id;
$function$;

REVOKE ALL ON FUNCTION public.lesson_completed_verified(UUID, UUID) FROM PUBLIC, anon, authenticated;

-- ── 2) Trigger: niente accreditamento con video senza durata ────────────────
CREATE OR REPLACE FUNCTION public.check_fpc_durations()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.fpc_accredited AND EXISTS (
    SELECT 1 FROM lessons l
     WHERE l.course_id = NEW.id AND l.type = 'video'
       AND COALESCE(l.duration_seconds, 0) <= 0
  ) THEN
    RAISE EXCEPTION 'Corso accreditato: ogni lezione video deve avere la durata impostata (serve per verificare il tempo di visione)';
  END IF;
  RETURN NEW;
END
$function$;

DROP TRIGGER IF EXISTS trg_check_fpc_durations ON public.courses;
CREATE TRIGGER trg_check_fpc_durations
  BEFORE INSERT OR UPDATE OF fpc_accredited ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.check_fpc_durations();

-- ── 3) issue_certificate v3: criterio verificato sugli accreditati ──────────
CREATE OR REPLACE FUNCTION public.issue_certificate(p_course_id uuid)
 RETURNS certificates
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user UUID := auth.uid();
  v_total INT;
  v_done INT;
  v_threshold INT;
  v_fpc BOOLEAN;
  v_test BOOLEAN;
  v_pct INT;
  v_cert certificates;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Non autenticato';
  END IF;

  SELECT certificate_threshold_percent, fpc_accredited, fpc_requires_test
    INTO v_threshold, v_fpc, v_test
    FROM courses WHERE id = p_course_id AND issues_certificate;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Questo corso non rilascia attestati';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM enrollments
    WHERE user_id = v_user AND course_id = p_course_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Iscrizione non attiva';
  END IF;

  SELECT COUNT(*) INTO v_total FROM lessons WHERE course_id = p_course_id;
  IF v_total = 0 THEN
    RAISE EXCEPTION 'Il corso non ha contenuti';
  END IF;

  IF v_fpc THEN
    -- Corso accreditato: stesso criterio del tracciato (maturato), così
    -- l'attestato con i crediti non può divergere da ciò che va all'Ordine.
    IF EXISTS (
      SELECT 1 FROM lessons l
       WHERE l.course_id = p_course_id
         AND NOT lesson_completed_verified(v_user, l.id)
    ) THEN
      RAISE EXCEPTION 'Per l''attestato serve il completamento verificato di tutti i contenuti (tempo di visione effettivo)';
    END IF;
    IF v_test AND NOT EXISTS (
      SELECT 1 FROM quiz_attempts qa
      JOIN lessons l ON l.id = qa.lesson_id AND l.course_id = p_course_id AND l.type = 'quiz'
      WHERE qa.user_id = v_user AND qa.passed
    ) THEN
      RAISE EXCEPTION 'Per l''attestato serve il superamento del test finale';
    END IF;
  ELSE
    -- Corso non accreditato: % di lezioni completate (gamification).
    SELECT COUNT(*) INTO v_done
      FROM lesson_progress
      WHERE user_id = v_user AND course_id = p_course_id AND completed;
    v_pct := ROUND(v_done::NUMERIC / v_total * 100);
    IF v_pct < v_threshold THEN
      RAISE EXCEPTION 'Corso completato al %%% — serve almeno %%% per l''attestato', v_pct, v_threshold;
    END IF;
  END IF;

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
END $function$;
