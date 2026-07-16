-- FASE 1 crediti FPC — tracciamento del tempo di visione lato SERVER.
--
-- Requisito CNDCEC: "tracciamento server-side ... registri informatici
-- inalterabili", con calcolo della PERMANENZA NETTA al netto delle
-- disconnessioni.
--
-- Principio anti-frode: il client NON dichiara mai quanti secondi ha visto.
-- Manda solo un "tick" periodico (heartbeat) mentre il video è in play; il
-- server misura l'intervallo dal tick precedente con il PROPRIO orologio
-- (now()) e accredita al massimo la durata di un heartbeat. Per falsificare
-- 2 ore bisognerebbe tenere aperta la sessione per 2 ore reali.
--
-- Inalterabilità: la tabella ha RLS SENZA policy di INSERT/UPDATE/DELETE →
-- nessun client può scrivere, modificare o cancellare. L'unica scrittura
-- possibile è tramite la RPC SECURITY DEFINER qui sotto (append-only).

CREATE TABLE IF NOT EXISTS public.learning_time_log (
  id               BIGSERIAL PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id        UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id        UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  -- raggruppa i tick di una singola sessione di visione (generato dal client)
  session_id       UUID NOT NULL,
  -- orologio del SERVER, mai del client
  tick_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- secondi validati dal server per questo tick (0 = apertura segmento o gap)
  seconds_credited INTEGER NOT NULL CHECK (seconds_credited >= 0)
);

CREATE INDEX IF NOT EXISTS idx_ltl_user_course ON public.learning_time_log(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_ltl_session ON public.learning_time_log(user_id, session_id, tick_at DESC);

ALTER TABLE public.learning_time_log ENABLE ROW LEVEL SECURITY;

-- Sola lettura. NESSUNA policy di scrittura = log inalterabile lato client.
CREATE POLICY "Users read own time log" ON public.learning_time_log
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins read all time log" ON public.learning_time_log
  FOR SELECT USING (is_admin());

-- Registra un tick e restituisce il totale netto sul corso.
-- MAX_CREDIT: tetto per tick (heartbeat 30s + tolleranza) → nessuno può
--   accreditarsi più tempo di quello realmente trascorso.
-- MAX_GAP: oltre questa distanza il tick è considerato ripresa dopo
--   disconnessione → il buco NON viene conteggiato (permanenza netta).
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
    v_credit := 0;                       -- primo tick: apre il segmento
  ELSE
    v_delta := EXTRACT(EPOCH FROM (now() - v_last));
    IF v_delta > MAX_GAP THEN
      v_credit := 0;                     -- disconnessione: gap non contato
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

-- Totali netti per (utente, corso) e per (utente, lezione).
-- security_invoker → l'admin vede tutto, l'utente solo il proprio.
CREATE OR REPLACE VIEW public.course_time_totals AS
SELECT user_id, course_id, SUM(seconds_credited)::BIGINT AS net_seconds
FROM public.learning_time_log
GROUP BY user_id, course_id;
ALTER VIEW public.course_time_totals SET (security_invoker = true);

CREATE OR REPLACE VIEW public.lesson_time_totals AS
SELECT user_id, course_id, lesson_id, SUM(seconds_credited)::BIGINT AS net_seconds
FROM public.learning_time_log
WHERE lesson_id IS NOT NULL
GROUP BY user_id, course_id, lesson_id;
ALTER VIEW public.lesson_time_totals SET (security_invoker = true);
