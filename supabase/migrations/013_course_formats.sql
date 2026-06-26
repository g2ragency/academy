-- ============================================================
-- 013: Tipologia Formativa gestibile da admin (course_formats)
--
-- Sostituisce l'enum fisso `course_type` con una tabella seedabile/
-- estendibile dall'admin (con icona caricabile). `courses.type` resta
-- una slug-stringa (chiave di join) con FK a course_formats(slug), così
-- i componenti che leggono course.type continuano a funzionare e i corsi
-- esistenti restano validi (slug = vecchi valori enum).
-- ============================================================

-- ------------------------------------------------------------
-- Tabella formati. icon_url: SVG caricato dall'admin (bucket pubblico
-- academy/format-icons). NULL = usa l'icona interna del componente
-- FormatIcon (i 7 default sono tematizzabili via currentColor).
-- ------------------------------------------------------------
CREATE TABLE course_formats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE course_formats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Course formats are publicly readable" ON course_formats FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage course formats" ON course_formats FOR ALL USING (public.is_admin());

-- Seed: 5 esistenti (slug = valori enum attuali) + 2 nuovi
INSERT INTO course_formats (name, slug, sort_order) VALUES
  ('Webinar', 'webinar', 0),
  ('Masterclass', 'masterclass', 1),
  ('Fast Focus', 'fast_focus', 2),
  ('Short Master', 'short_master', 3),
  ('Executive Master', 'executive_master', 4),
  ('Guide e Vademecum', 'guide_vademecum', 5),
  ('Convegni & Tavole Rotonde', 'convegni', 6)
ON CONFLICT (slug) DO NOTHING;

-- ------------------------------------------------------------
-- courses.type: enum -> text + FK alla tabella formati.
-- ------------------------------------------------------------
ALTER TABLE courses ALTER COLUMN type DROP DEFAULT;
ALTER TABLE courses ALTER COLUMN type TYPE TEXT USING type::text;
ALTER TABLE courses ALTER COLUMN type SET DEFAULT 'webinar';

-- L'enum era usato solo da courses.type
DROP TYPE course_type;

-- Integrità: niente tipi inesistenti; rinominare uno slug propaga,
-- eliminare un formato in uso è bloccato.
ALTER TABLE courses
  ADD CONSTRAINT courses_type_fk
  FOREIGN KEY (type) REFERENCES course_formats(slug)
  ON UPDATE CASCADE ON DELETE RESTRICT;
