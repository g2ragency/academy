-- FASE 5 crediti FPC — TRACCIATO PARTECIPANTI (9 colonne).
--
-- Non c'è integrazione con l'Ordine: è un export che l'admin scarica e invia.
-- Colonne del modello ufficiale (TracciatoPartecipantiEventiFPC_Excel.xls):
--   codicecorso | codicefiscale | data | ore | minuti | superamentotest
--   | materia | totalecreditipermateria | giornata
--
-- Restituisce TUTTI gli iscritti, non solo chi ha maturato i crediti, con il
-- flag `maturato` e il `motivo` dell'esclusione: alla prima domanda dell'admin
-- ("perché Mario non c'è?") si risponde guardando la stessa tabella. È la UI a
-- esportare le sole righe con maturato = true.
--
-- `ore`/`minuti` sono il tempo NETTO dai log immutabili, non la durata nominale
-- del corso: è il dato che l'attestato e il tracciato devono dichiarare.
CREATE OR REPLACE FUNCTION public.fpc_tracciato(p_course_id UUID)
RETURNS TABLE(
  user_id                 UUID,
  nominativo              TEXT,
  codicecorso             TEXT,
  codicefiscale           TEXT,
  data                    DATE,
  ore                     INTEGER,
  minuti                  INTEGER,
  superamentotest         TEXT,
  materia                 TEXT,
  totalecreditipermateria NUMERIC,
  giornata                DATE,
  maturato                BOOLEAN,
  motivo                  TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Riservato agli amministratori';
  END IF;

  RETURN QUERY
  WITH c AS (
    SELECT * FROM courses WHERE id = p_course_id AND fpc_accredited
  ),
  lez AS (
    SELECT l.id, l.type FROM lessons l WHERE l.course_id = p_course_id
  ),
  iscritti AS (
    SELECT e.user_id AS uid FROM enrollments e
     WHERE e.course_id = p_course_id AND e.status = 'active'
  ),
  -- Stesso criterio dello sblocco sequenziale: completamento verificato lezione
  -- per lezione. Un corso senza lezioni non fa maturare nulla (bool_and → NULL).
  verifica AS (
    SELECT i.uid, COALESCE(bool_and(lesson_completed_verified(i.uid, l.id)), FALSE) AS tutte
      FROM iscritti i LEFT JOIN lez l ON TRUE
     GROUP BY i.uid
  ),
  tempo AS (
    SELECT t.user_id AS uid, SUM(t.seconds_credited)::INT AS sec, MAX(t.tick_at)::DATE AS ultimo
      FROM learning_time_log t WHERE t.course_id = p_course_id GROUP BY t.user_id
  ),
  esame AS (
    SELECT qa.user_id AS uid, bool_or(qa.passed) AS superato
      FROM quiz_attempts qa JOIN lez l ON l.id = qa.lesson_id AND l.type = 'quiz'
     GROUP BY qa.user_id
  )
  SELECT
    i.uid,
    pr.full_name,
    c.fpc_course_code,
    pr.tax_code,
    t.ultimo,                                    -- data = giorno di fruizione
    (COALESCE(t.sec, 0) / 3600),
    ((COALESCE(t.sec, 0) % 3600) / 60),
    -- ❓ da confermare con l'Ordine: valori ammessi e cosa mettere sui corsi
    -- senza test (per ora 'N').
    CASE WHEN COALESCE(x.superato, FALSE) THEN 'S' ELSE 'N' END,
    c.fpc_subject,
    c.fpc_credits,
    t.ultimo,                                    -- ❓ giornata: stessa data, salvo indicazione contraria
    (v.tutte AND pr.tax_code IS NOT NULL
             AND (NOT c.fpc_requires_test OR COALESCE(x.superato, FALSE))),
    CASE
      WHEN pr.tax_code IS NULL THEN 'Codice Fiscale mancante'
      WHEN NOT v.tutte THEN 'Contenuti non completati per intero'
      WHEN c.fpc_requires_test AND NOT COALESCE(x.superato, FALSE) THEN 'Test finale non superato'
      ELSE NULL
    END
  FROM iscritti i
  CROSS JOIN c
  JOIN profiles pr ON pr.id = i.uid
  JOIN verifica v  ON v.uid = i.uid
  LEFT JOIN tempo t ON t.uid = i.uid
  LEFT JOIN esame x ON x.uid = i.uid
  ORDER BY pr.full_name;
END
$function$;
