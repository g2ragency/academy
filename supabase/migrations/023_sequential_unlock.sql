-- FASE 3 crediti FPC — SBLOCCO SEQUENZIALE DEI MODULI.
--
-- Requisito CNDCEC: i contenuti successivi si sbloccano solo dopo il
-- completamento VERIFICATO dei precedenti. "Verificato" è la parola che conta:
-- il flag `lesson_progress.completed` lo scrive il client ed è falsificabile,
-- quindi non può essere lui a decidere lo sblocco.
--
-- Ambito: solo i corsi `fpc_accredited`. La sequenzialità è un vincolo di
-- normativa, non una scelta di prodotto: imporla a tutto il catalogo
-- peggiorerebbe la fruizione dei corsi liberi senza dare nulla in cambio.
-- Se un domani la si vuole anche altrove, serve un flag separato sul corso.

-- Completamento VERIFICATO di una lezione:
--   • video con durata nota → tempo netto dai log immutabili >= 95% della durata
--   • quiz                  → esiste un tentativo superato
--   • pdf/testo, o video SENZA durata → flag lesson_progress (fallback onesto:
--     per questi contenuti non abbiamo un segnale server-side).
-- ⚠️ Il fallback è il punto debole: su un corso accreditato ogni lezione video
-- DEVE avere `duration_seconds` valorizzata, altrimenti lo sblocco torna a
-- fidarsi del client. Vedi l'avviso in ModulesManager (admin).
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
      ), 0) >= l.duration_seconds * 0.95   -- tolleranza 5% (planning §7: da confermare con l'Ordine)
    WHEN l.type = 'quiz' THEN
      EXISTS (
        SELECT 1 FROM quiz_attempts qa
         WHERE qa.user_id = p_user AND qa.lesson_id = p_lesson_id AND qa.passed
      )
    ELSE
      COALESCE((
        SELECT p.completed FROM lesson_progress p
         WHERE p.user_id = p_user AND p.lesson_id = p_lesson_id
      ), FALSE)
  END
  FROM lessons l WHERE l.id = p_lesson_id;
$function$;

-- Prende un p_user arbitrario e bypassa la RLS: richiamabile solo dalle RPC
-- qui sotto, altrimenti chiunque potrebbe sondare l'avanzamento altrui.
REVOKE ALL ON FUNCTION public.lesson_completed_verified(UUID, UUID) FROM PUBLIC, anon, authenticated;

-- Stato per-lezione del corso per l'utente corrente. Unica fonte di verità:
-- la UI la interroga invece di ri-implementare la regola in TypeScript.
CREATE OR REPLACE FUNCTION public.course_lesson_state(p_course_id UUID)
RETURNS TABLE(lesson_id UUID, verified BOOLEAN, unlocked BOOLEAN)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH ordered AS (
    -- Ordine reale del corso: modulo, poi lezione dentro il modulo.
    -- `lessons.sort_order` riparte da 0 in ogni modulo, quindi da solo non ordina.
    SELECT l.id,
           row_number() OVER (ORDER BY m.sort_order, l.sort_order) AS pos,
           lesson_completed_verified(auth.uid(), l.id) AS verified
      FROM lessons l
      JOIN modules m ON m.id = l.module_id
     WHERE l.course_id = p_course_id
       AND EXISTS (
         SELECT 1 FROM enrollments e
          WHERE e.user_id = auth.uid() AND e.course_id = p_course_id AND e.status = 'active'
       )
  )
  SELECT o.id,
         o.verified,
         CASE
           WHEN NOT (SELECT c.fpc_accredited FROM courses c WHERE c.id = p_course_id) THEN TRUE
           -- sbloccata se TUTTE le precedenti sono verificate (frame vuoto
           -- sulla prima riga → NULL → la prima lezione è sempre aperta)
           ELSE COALESCE(
             bool_and(o.verified) OVER (ORDER BY o.pos ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING),
             TRUE)
         END
    FROM ordered o
   ORDER BY o.pos;
$function$;

-- record_learning_tick + presidio dello sblocco sequenziale.
-- Il lucchetto nella UI è cortesia; questo è il vero vincolo: su una lezione
-- bloccata non si accumula tempo, quindi non si maturano crediti.
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

  -- Sblocco sequenziale (solo corsi accreditati).
  IF (SELECT c.fpc_accredited FROM courses c WHERE c.id = v_course) THEN
    IF EXISTS (
      SELECT 1
        FROM lessons cur
        JOIN modules cm   ON cm.id = cur.module_id
        JOIN lessons prev ON prev.course_id = v_course
        JOIN modules pm   ON pm.id = prev.module_id
       WHERE cur.id = p_lesson_id
         AND (pm.sort_order, prev.sort_order) < (cm.sort_order, cur.sort_order)
         AND NOT lesson_completed_verified(v_user, prev.id)
    ) THEN
      RAISE EXCEPTION 'LEZIONE_BLOCCATA: completa prima le lezioni precedenti';
    END IF;
  END IF;

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

  SELECT t.tick_at, t.position_seconds INTO v_last_at, v_last_pos
    FROM learning_time_log t
   WHERE t.user_id = v_user AND t.session_id = p_session_id AND t.lesson_id = p_lesson_id
   ORDER BY t.tick_at DESC
   LIMIT 1;

  IF v_last_at IS NULL THEN
    v_credit := 0;
  ELSE
    v_delta := EXTRACT(EPOCH FROM (now() - v_last_at));
    IF v_delta > MAX_GAP THEN
      v_credit := 0;
    ELSE
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
