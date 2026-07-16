-- FIX: il tempo in PAUSA veniva accreditato.
--
-- Bug (trovato testando la Fase 3): il tick accreditava "i secondi passati
-- dall'ultimo tick" purché sotto MAX_GAP. Ma una pausa produce esattamente lo
-- stesso schema di una latenza di rete: onPause manda un tick, onPlaying ne
-- manda un altro N secondi dopo → N secondi accreditati a video FERMO.
-- Misurato: pausa di 60s → 40 secondi accreditati (il tetto MAX_CREDIT).
-- Il ciclo play→pausa→attendi→play accumulava tempo pieno senza guardare
-- nulla: è proprio ciò che la "permanenza netta" del Regolamento esclude.
--
-- Fix: il tick porta anche la POSIZIONE del video e il server accredita il
-- MINIMO fra quanto è passato sul proprio orologio e quanto è avanzata la
-- posizione:
--   • pausa / buffering  → posizione ferma        → 0 accreditato
--   • riproduzione a 1x  → i due valori coincidono → accredito corretto
--   • riproduzione a 2x  → limita l'orologio       → 30 min di presenza valgono 30 min
--   • client che mente sulla posizione → limita comunque l'orologio
-- Invariante che ne risulta: accreditato <= tempo di presenza reale.
--
-- La posizione è OBBLIGATORIA sui video: renderla opzionale riaprirebbe il
-- buco, basterebbe ometterla per tornare al conteggio a orologio.

ALTER TABLE public.learning_time_log
  ADD COLUMN IF NOT EXISTS position_seconds NUMERIC;

-- Il vecchio 2-argomenti va rimosso: con un DEFAULT resterebbe come overload
-- e le chiamate a 2 arg tornerebbero al conteggio a orologio.
DROP FUNCTION IF EXISTS public.record_learning_tick(UUID, UUID);

CREATE OR REPLACE FUNCTION public.record_learning_tick(
  p_lesson_id        UUID,
  p_session_id       UUID,
  p_position_seconds NUMERIC
)
RETURNS TABLE(net_seconds BIGINT, credited INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user     UUID := auth.uid();
  v_course   UUID;
  v_type     lesson_type;
  v_last_at  TIMESTAMPTZ;
  v_last_pos NUMERIC;
  v_delta    NUMERIC;
  v_moved    NUMERIC;
  v_credit   INTEGER;
  v_holder   UUID;
  v_seen     TIMESTAMPTZ;
  MAX_CREDIT CONSTANT INTEGER := 40;
  MAX_GAP    CONSTANT INTEGER := 90;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Non autenticato';
  END IF;

  -- Serializza i tick dello stesso utente: senza lock due chiamate concorrenti
  -- leggerebbero lo stesso "ultimo tick" e accrediterebbero entrambe l'intervallo.
  PERFORM pg_advisory_xact_lock(hashtextextended(v_user::text, 0));

  SELECT l.course_id, l.type INTO v_course, v_type FROM lessons l WHERE l.id = p_lesson_id;
  IF v_course IS NULL THEN
    RAISE EXCEPTION 'Lezione inesistente';
  END IF;

  IF v_type = 'video' AND p_position_seconds IS NULL THEN
    RAISE EXCEPTION 'Posizione del video obbligatoria';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM enrollments e
    WHERE e.user_id = v_user AND e.course_id = v_course AND e.status = 'active'
  ) THEN
    RAISE EXCEPTION 'Iscrizione non attiva';
  END IF;

  -- Presidio sessione unica: c'è già un'altra sessione viva?
  SELECT session_id, last_tick_at INTO v_holder, v_seen
    FROM learning_active_session WHERE user_id = v_user;

  IF v_holder IS NOT NULL
     AND v_holder <> p_session_id
     AND v_seen > now() - make_interval(secs => MAX_GAP) THEN
    RAISE EXCEPTION 'SESSIONE_CONCORRENTE: la visione è già attiva su un altro dispositivo o scheda';
  END IF;

  INSERT INTO learning_active_session (user_id, session_id, last_tick_at)
  VALUES (v_user, p_session_id, now())
  ON CONFLICT (user_id) DO UPDATE
    SET session_id = EXCLUDED.session_id, last_tick_at = EXCLUDED.last_tick_at;

  -- Ultimo tick della stessa sessione SULLA STESSA LEZIONE: confrontare la
  -- posizione fra video diversi non avrebbe senso.
  SELECT t.tick_at, t.position_seconds INTO v_last_at, v_last_pos
    FROM learning_time_log t
   WHERE t.user_id = v_user AND t.session_id = p_session_id AND t.lesson_id = p_lesson_id
   ORDER BY t.tick_at DESC
   LIMIT 1;

  IF v_last_at IS NULL THEN
    v_credit := 0;                                  -- primo tick: apre il segmento
  ELSE
    v_delta := EXTRACT(EPOCH FROM (now() - v_last_at));
    IF v_delta > MAX_GAP THEN
      v_credit := 0;                                -- disconnessione: non è permanenza
    ELSE
      -- Avanzamento del video fra i due tick. Riavvolgere dà un valore negativo
      -- → 0: quel singolo tick non accredita (conservativo, i successivi sì).
      -- COALESCE: tick storici senza posizione → vecchio conteggio a orologio.
      v_moved  := COALESCE(p_position_seconds - v_last_pos, v_delta);
      v_credit := GREATEST(0, LEAST(v_delta, v_moved, MAX_CREDIT))::INTEGER;
    END IF;
  END IF;

  INSERT INTO learning_time_log (user_id, course_id, lesson_id, session_id, seconds_credited, position_seconds)
  VALUES (v_user, v_course, p_lesson_id, p_session_id, v_credit, p_position_seconds);

  RETURN QUERY
    SELECT COALESCE(SUM(t.seconds_credited), 0)::BIGINT, v_credit
      FROM learning_time_log t
     WHERE t.user_id = v_user AND t.course_id = v_course;
END
$function$;
