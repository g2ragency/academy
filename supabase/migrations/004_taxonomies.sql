-- ============================================================
-- 004: Tassonomia dinamica gestita dall'admin
--      + prep migrazione video provider + view popolarità corsi
-- ============================================================

-- Prep migrazione futura a provider video esterno (Bunny/Mux):
-- oggi tutto è 'supabase' (path nel bucket) o URL esterno.
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS video_provider TEXT NOT NULL DEFAULT 'supabase';

-- ------------------------------------------------------------
-- Gruppi di classificazione (es. "Argomenti", "Ruoli", "Tag").
-- L'admin li crea in autonomia; il frontend li renderizza
-- automaticamente (filtri /corsi, chip in home).
-- ------------------------------------------------------------
CREATE TABLE taxonomies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  applies_to_courses BOOLEAN NOT NULL DEFAULT TRUE,
  applies_to_instructors BOOLEAN NOT NULL DEFAULT FALSE,
  show_in_filters BOOLEAN NOT NULL DEFAULT TRUE,
  show_in_home BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Voci della tassonomia, gerarchiche (categoria -> sottocategoria via parent_id)
CREATE TABLE terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxonomy_id UUID NOT NULL REFERENCES taxonomies(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES terms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (taxonomy_id, slug)
);
CREATE INDEX idx_terms_taxonomy ON terms(taxonomy_id);
CREATE INDEX idx_terms_parent ON terms(parent_id);

CREATE TABLE course_terms (
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  PRIMARY KEY (course_id, term_id)
);
CREATE INDEX idx_course_terms_term ON course_terms(term_id);

CREATE TABLE instructor_terms (
  instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  PRIMARY KEY (instructor_id, term_id)
);
CREATE INDEX idx_instructor_terms_term ON instructor_terms(term_id);

-- RLS: lettura pubblica, scrittura solo admin (stesso pattern delle altre tabelle)
ALTER TABLE taxonomies ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Taxonomies are publicly readable" ON taxonomies FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage taxonomies" ON taxonomies FOR ALL USING (public.is_admin());

CREATE POLICY "Terms are publicly readable" ON terms FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage terms" ON terms FOR ALL USING (public.is_admin());

CREATE POLICY "Course terms are publicly readable" ON course_terms FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage course terms" ON course_terms FOR ALL USING (public.is_admin());

CREATE POLICY "Instructor terms are publicly readable" ON instructor_terms FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage instructor terms" ON instructor_terms FOR ALL USING (public.is_admin());

-- ------------------------------------------------------------
-- Popolarità corsi: espone SOLO conteggi aggregati (gli
-- enrollment restano privati). Usata per "corsi più seguiti"
-- e ordinamento trending.
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW course_popularity AS
  SELECT course_id, COUNT(*)::INT AS enrollment_count
  FROM enrollments
  WHERE status = 'active'
  GROUP BY course_id;

GRANT SELECT ON course_popularity TO anon, authenticated;

-- ------------------------------------------------------------
-- Migrazione dei tag legacy (courses.tags TEXT[]) in una
-- taxonomy "Tag" con terms piatti. Il campo courses.tags
-- resta per compatibilità ma è deprecato.
-- ------------------------------------------------------------
DO $$
DECLARE
  tag_taxonomy_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM courses WHERE tags IS NOT NULL AND array_length(tags, 1) > 0) THEN
    INSERT INTO taxonomies (name, slug, show_in_filters)
    VALUES ('Tag', 'tag', TRUE)
    ON CONFLICT (slug) DO NOTHING;

    SELECT id INTO tag_taxonomy_id FROM taxonomies WHERE slug = 'tag';

    INSERT INTO terms (taxonomy_id, name, slug)
    SELECT DISTINCT tag_taxonomy_id, t,
      trim(BOTH '-' FROM lower(regexp_replace(t, '[^a-zA-Z0-9]+', '-', 'g')))
    FROM courses c CROSS JOIN LATERAL unnest(c.tags) AS t
    ON CONFLICT (taxonomy_id, slug) DO NOTHING;

    INSERT INTO course_terms (course_id, term_id)
    SELECT c.id, tr.id
    FROM courses c
    CROSS JOIN LATERAL unnest(c.tags) AS t
    JOIN terms tr
      ON tr.taxonomy_id = tag_taxonomy_id
     AND tr.slug = trim(BOTH '-' FROM lower(regexp_replace(t, '[^a-zA-Z0-9]+', '-', 'g')))
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
