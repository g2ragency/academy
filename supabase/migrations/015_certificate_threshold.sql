-- Soglia di completamento per il rilascio dell'attestato, configurabile per corso.
-- Prima era fisso 100%; il cliente vuole poterla impostare (default 80%).
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS certificate_threshold_percent INTEGER NOT NULL DEFAULT 80
  CHECK (certificate_threshold_percent BETWEEN 1 AND 100);

-- issue_certificate ora valida contro la soglia del corso (non più 100% fisso).
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
  v_pct INT;
  v_cert certificates;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Non autenticato';
  END IF;

  SELECT certificate_threshold_percent INTO v_threshold
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
  SELECT COUNT(*) INTO v_done
    FROM lesson_progress
    WHERE user_id = v_user AND course_id = p_course_id AND completed;

  v_pct := CASE WHEN v_total = 0 THEN 0 ELSE ROUND(v_done::NUMERIC / v_total * 100) END;

  IF v_total = 0 OR v_pct < v_threshold THEN
    RAISE EXCEPTION 'Corso completato al %%% — serve almeno %%% per l''attestato', v_pct, v_threshold;
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
