-- ============================================================
-- 008: Campi pagina corso (design Figma)
--
-- - course_instructors: piu' relatori per corso (carosello
--   "Relatori"); courses.instructor_id resta come fallback e
--   per la pagina docente, il primo relatore lo tiene allineato.
-- - courses.topics: "Gli argomenti trattati" (un elemento per
--   bullet, textarea nell'admin un argomento per riga)
-- - courses.program_pdf_url: PDF programma scaricabile dal
--   riepilogo (bucket PUBBLICO academy: e' materiale marketing)
-- - seed taxonomy "Per chi" per le chips "Per chi e' pensato
--   il corso" (gestibile da /admin/tassonomie)
-- ============================================================

CREATE TABLE course_instructors (
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (course_id, instructor_id)
);
CREATE INDEX idx_course_instructors_instructor ON course_instructors(instructor_id);

ALTER TABLE course_instructors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Course instructors are publicly readable" ON course_instructors FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage course instructors" ON course_instructors FOR ALL USING (public.is_admin());

-- Backfill dal docente singolo esistente
INSERT INTO course_instructors (course_id, instructor_id, sort_order)
SELECT id, instructor_id, 0 FROM courses WHERE instructor_id IS NOT NULL
ON CONFLICT DO NOTHING;

ALTER TABLE courses ADD COLUMN IF NOT EXISTS topics TEXT[];
ALTER TABLE courses ADD COLUMN IF NOT EXISTS program_pdf_url TEXT;

-- Taxonomy "Per chi" (chips "Per chi e' pensato il corso")
DO $$
DECLARE
  v_taxonomy_id UUID;
BEGIN
  INSERT INTO taxonomies (name, slug, applies_to_courses, show_in_filters, show_in_home, sort_order)
  VALUES ('Per chi', 'per-chi', TRUE, TRUE, FALSE, 10)
  ON CONFLICT (slug) DO NOTHING;

  SELECT id INTO v_taxonomy_id FROM taxonomies WHERE slug = 'per-chi';

  INSERT INTO terms (taxonomy_id, name, slug, sort_order) VALUES
    (v_taxonomy_id, 'Professionisti', 'professionisti', 0),
    (v_taxonomy_id, 'Avvocati', 'avvocati', 1),
    (v_taxonomy_id, 'Commercialisti', 'commercialisti', 2),
    (v_taxonomy_id, 'Imprenditori', 'imprenditori', 3)
  ON CONFLICT (taxonomy_id, slug) DO NOTHING;
END $$;
