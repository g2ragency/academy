-- ============================================================
-- FIX: ricorsione infinita nelle policy RLS (errore 42P17)
--
-- Le policy admin facevano EXISTS su `profiles`, ma `profiles`
-- ha RLS attiva e una di quelle policy è sulla stessa tabella:
-- Postgres rileva ricorsione e fa fallire OGNI query su profiles
-- (e a cascata su tutte le tabelle con il check admin).
--
-- Soluzione: funzione SECURITY DEFINER che legge `profiles`
-- bypassando la RLS, usata da tutte le policy admin.
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- Profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (is_admin());

-- Instructors
DROP POLICY IF EXISTS "Admins can manage instructors" ON instructors;
CREATE POLICY "Admins can manage instructors" ON instructors FOR ALL USING (is_admin());

-- Courses
DROP POLICY IF EXISTS "Admins can manage courses" ON courses;
CREATE POLICY "Admins can manage courses" ON courses FOR ALL USING (is_admin());

-- Modules
DROP POLICY IF EXISTS "Admins can manage modules" ON modules;
CREATE POLICY "Admins can manage modules" ON modules FOR ALL USING (is_admin());

-- Lessons
DROP POLICY IF EXISTS "Admins can manage lessons" ON lessons;
CREATE POLICY "Admins can manage lessons" ON lessons FOR ALL USING (is_admin());

-- Quiz questions
DROP POLICY IF EXISTS "Admins can manage quiz questions" ON quiz_questions;
CREATE POLICY "Admins can manage quiz questions" ON quiz_questions FOR ALL USING (is_admin());

-- Enrollments
DROP POLICY IF EXISTS "Admins can view all enrollments" ON enrollments;
CREATE POLICY "Admins can view all enrollments" ON enrollments FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "Admins can manage enrollments" ON enrollments;
CREATE POLICY "Admins can manage enrollments" ON enrollments FOR ALL USING (is_admin());

-- Lesson progress
DROP POLICY IF EXISTS "Admins can view all progress" ON lesson_progress;
CREATE POLICY "Admins can view all progress" ON lesson_progress FOR SELECT USING (is_admin());

-- Quiz attempts
DROP POLICY IF EXISTS "Admins can view all quiz attempts" ON quiz_attempts;
CREATE POLICY "Admins can view all quiz attempts" ON quiz_attempts FOR SELECT USING (is_admin());
