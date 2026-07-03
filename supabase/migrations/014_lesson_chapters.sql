-- Capitoli di un video-lezione: marcatori temporali titolati,
-- stile YouTube. Un corso "a video unico" è una lezione video con i suoi
-- capitoli (start_seconds → il player fa il seek). Titoli/tempi non sono
-- segreti (sono un indice): lettura pubblica sui corsi pubblicati, come i moduli.

CREATE TABLE IF NOT EXISTS public.lesson_chapters (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id     UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  start_seconds INTEGER NOT NULL DEFAULT 0 CHECK (start_seconds >= 0),
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lesson_chapters_lesson ON public.lesson_chapters(lesson_id);

ALTER TABLE public.lesson_chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage chapters" ON public.lesson_chapters
  FOR ALL USING (is_admin());

CREATE POLICY "Anyone can view chapters of published courses" ON public.lesson_chapters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON c.id = l.course_id
      WHERE l.id = lesson_chapters.lesson_id AND c.status = 'published'
    )
  );
