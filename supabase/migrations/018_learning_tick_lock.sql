-- FIX race condition in record_learning_tick.
--
-- Bug trovato in test: due tick concorrenti della stessa sessione leggevano
-- entrambi lo STESSO "ultimo tick", calcolavano entrambi delta = N e
-- accreditavano entrambi N secondi → in 10s reali ne venivano accreditati 20.
-- Sfruttabile: aspetti 40s, spari 100 chiamate in parallelo → 4000 secondi.
--
-- Fix: pg_advisory_xact_lock su (utente, sessione) all'inizio della funzione.
-- Le chiamate concorrenti della stessa sessione si mettono in coda; la seconda
-- rilegge l'ultimo tick aggiornato e calcola delta ≈ 0. Il lock si rilascia da
-- solo a fine transazione.

CREATE OR REPLACE FUNCTION public.record_learning_tick(p_lesson_id UUID, p_session_id UUID)
RETURNS TABLE(net_seconds BIGINT, credited INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user   UUID := auth.uid();
  v_course UUID;
  v_last   TIMESTAMPTZ;
  v_delta  NUMERIC;
  v_credit INTEGER;
  MAX_CREDIT CONSTANT INTEGER := 40;
  MAX_GAP    CONSTANT INTEGER := 90;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Non autenticato';
  END IF;

  -- Serializza i tick concorrenti della stessa sessione (vedi commento sopra).
  PERFORM pg_advisory_xact_lock(hashtextextended(v_user::text || ':' || p_session_id::text, 0));

  SELECT l.course_id INTO v_course FROM lessons l WHERE l.id = p_lesson_id;
  IF v_course IS NULL THEN
    RAISE EXCEPTION 'Lezione inesistente';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM enrollments e
    WHERE e.user_id = v_user AND e.course_id = v_course AND e.status = 'active'
  ) THEN
    RAISE EXCEPTION 'Iscrizione non attiva';
  END IF;

  SELECT t.tick_at INTO v_last
    FROM learning_time_log t
   WHERE t.user_id = v_user AND t.session_id = p_session_id
   ORDER BY t.tick_at DESC
   LIMIT 1;

  IF v_last IS NULL THEN
    v_credit := 0;
  ELSE
    v_delta := EXTRACT(EPOCH FROM (now() - v_last));
    IF v_delta > MAX_GAP THEN
      v_credit := 0;
    ELSE
      v_credit := GREATEST(0, LEAST(v_delta, MAX_CREDIT))::INTEGER;
    END IF;
  END IF;

  INSERT INTO learning_time_log (user_id, course_id, lesson_id, session_id, seconds_credited)
  VALUES (v_user, v_course, p_lesson_id, p_session_id, v_credit);

  RETURN QUERY
    SELECT COALESCE(SUM(t.seconds_credited), 0)::BIGINT, v_credit
      FROM learning_time_log t
     WHERE t.user_id = v_user AND t.course_id = v_course;
END
$function$;
