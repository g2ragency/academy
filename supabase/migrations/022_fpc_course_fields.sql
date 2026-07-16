-- FASE 4 crediti FPC — CAMPI DI ACCREDITAMENTO SUL CORSO.
--
-- Non esiste un'API con l'Ordine: codice corso, materia, crediti e periodo li
-- inserisce l'admin a mano, così come li ha ricevuti nella delibera di
-- accreditamento. Sono anche le colonne del tracciato da esportare (Fase 5).
-- Vedi docs/planning-funzionalita.md §7.

ALTER TABLE public.courses
  -- "accreditato per la FAD asincrona": NON basta che il webinar sincrono
  -- fosse accreditato, serve una richiesta specifica per l'asincrono.
  ADD COLUMN IF NOT EXISTS fpc_accredited     BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS fpc_course_code    TEXT,          -- tracciato: codicecorso
  ADD COLUMN IF NOT EXISTS fpc_subject        TEXT,          -- tracciato: materia (codice libero, lo dà l'Ordine)
  ADD COLUMN IF NOT EXISTS fpc_credits        NUMERIC(5,2),  -- tracciato: totalecreditipermateria
  ADD COLUMN IF NOT EXISTS fpc_requires_test  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS fpc_available_from DATE,
  ADD COLUMN IF NOT EXISTS fpc_available_to   DATE;

-- Un corso accreditato senza codice/materia/crediti non è esportabile nel
-- tracciato: meglio impedirlo qui che scoprirlo al momento dell'invio all'Ordine.
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_fpc_complete;
ALTER TABLE public.courses ADD CONSTRAINT courses_fpc_complete CHECK (
  NOT fpc_accredited OR (
    fpc_course_code IS NOT NULL AND btrim(fpc_course_code) <> '' AND
    fpc_subject     IS NOT NULL AND btrim(fpc_subject)     <> '' AND
    fpc_credits     IS NOT NULL AND fpc_credits > 0
  )
);

ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_fpc_period;
ALTER TABLE public.courses ADD CONSTRAINT courses_fpc_period CHECK (
  fpc_available_from IS NULL OR fpc_available_to IS NULL OR fpc_available_to >= fpc_available_from
);
