-- FASE 2a crediti FPC — BLOCCO DEGLI ACCESSI CONCORRENTI.
--
-- Requisito CNDCEC: "controlli rigorosi (come il blocco degli accessi
-- concorrenti) per evitare che un utente avvii più sessioni in contemporanea
-- eludendo le tempistiche di visione".
--
-- Serve anche a chiudere un buco emerso in Fase 1: il totale somma tutte le
-- sessioni, quindi due schede aperte in parallelo raddoppierebbero il tempo.
--
-- Modello: UNA sola sessione di visione viva per utente. Vince chi è già
-- dentro (l'incumbent); una seconda sessione viene RIFIUTATA. Alla pausa o
-- all'uscita il client chiama release_learning_session, così riaprire subito
-- non resta bloccato. Se il browser crasha, il lock scade da solo (MAX_GAP).

CREATE TABLE IF NOT EXISTS public.learning_active_session (
  user_id      UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id   UUID NOT NULL,
  last_tick_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.learning_active_session ENABLE ROW LEVEL SECURITY;
-- Sola lettura del proprio stato; la scrittura passa solo dalle RPC.
CREATE POLICY "Users read own active session" ON public.learning_active_session
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins read all active sessions" ON public.learning_active_session
  FOR SELECT USING (is_admin());

-- Rilascia la sessione (pausa / uscita dalla pagina).
CREATE OR REPLACE FUNCTION public.release_learning_session(p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL THEN RETURN; END IF;
  DELETE FROM learning_active_session
   WHERE user_id = v_user AND session_id = p_session_id;
END
$function$;

-- record_learning_tick + presidio sessione unica.
CREATE OR REPLACE FUNCTION public.record_learning_tick(p_lesson_id UUID, p_session_id UUID)
RETURNS TABLE(net_seconds BIGINT, credited INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user    UUID := auth.uid();
  v_course  UUID;
  v_last    TIMESTAMPTZ;
  v_delta   NUMERIC;
  v_credit  INTEGER;
  v_holder  UUID;
  v_seen    TIMESTAMPTZ;
  MAX_CREDIT CONSTANT INTEGER := 40;
  MAX_GAP    CONSTANT INTEGER := 90;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Non autenticato';
  END IF;

  -- Serializza i tick dello stesso utente: senza lock due chiamate concorrenti
  -- leggerebbero lo stesso "ultimo tick" e accrediterebbero entrambe l'intervallo.
  PERFORM pg_advisory_xact_lock(hashtextextended(v_user::text, 0));

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

  -- Presidio: c'è già un'altra sessione viva?
  SELECT session_id, last_tick_at INTO v_holder, v_seen
    FROM learning_active_session WHERE user_id = v_user;

  IF v_holder IS NOT NULL
     AND v_holder <> p_session_id
     AND v_seen > now() - make_interval(secs => MAX_GAP) THEN
    RAISE EXCEPTION 'SESSIONE_CONCORRENTE: la visione è già attiva su un altro dispositivo o scheda';
  END IF;

  -- Questa sessione prende/mantiene il posto
  INSERT INTO learning_active_session (user_id, session_id, last_tick_at)
  VALUES (v_user, p_session_id, now())
  ON CONFLICT (user_id) DO UPDATE
    SET session_id = EXCLUDED.session_id, last_tick_at = EXCLUDED.last_tick_at;

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
