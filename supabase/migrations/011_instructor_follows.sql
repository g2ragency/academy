CREATE TABLE public.instructor_follows (
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  notify        BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, instructor_id)
);

ALTER TABLE public.instructor_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own instructor follows"
  ON public.instructor_follows
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
