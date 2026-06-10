-- ============================================================
-- ACADEMY PLATFORM - DATABASE SCHEMA
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE course_type AS ENUM (
  'webinar',
  'masterclass',
  'fast_focus',
  'short_master',
  'executive_master'
);

CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived');

CREATE TYPE lesson_type AS ENUM ('video', 'text', 'pdf', 'quiz');

CREATE TYPE enrollment_status AS ENUM ('active', 'expired', 'cancelled');

CREATE TYPE user_role AS ENUM ('user', 'admin');

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================

CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'user',
  company TEXT,
  bio TEXT,
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- ============================================================
-- INSTRUCTORS
-- ============================================================

CREATE TABLE instructors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  full_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  title TEXT,
  linkedin_url TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- COURSES
-- ============================================================

CREATE TABLE courses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  thumbnail_url TEXT,
  preview_video_url TEXT,
  type course_type NOT NULL DEFAULT 'webinar',
  status course_status NOT NULL DEFAULT 'draft',
  price_cents INT NOT NULL DEFAULT 0,
  stripe_price_id TEXT,
  instructor_id UUID REFERENCES instructors(id) ON DELETE SET NULL,
  duration_minutes INT,
  level TEXT CHECK (level IN ('base', 'intermedio', 'avanzato')),
  tags TEXT[],
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MODULES (sezioni del corso)
-- ============================================================

CREATE TABLE modules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- LESSONS
-- ============================================================

CREATE TABLE lessons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  type lesson_type NOT NULL DEFAULT 'video',
  content TEXT,
  video_url TEXT,
  pdf_url TEXT,
  duration_seconds INT,
  sort_order INT NOT NULL DEFAULT 0,
  is_preview BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- QUIZ QUESTIONS
-- ============================================================

CREATE TABLE quiz_questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_option_index INT NOT NULL,
  explanation TEXT,
  sort_order INT NOT NULL DEFAULT 0
);

-- ============================================================
-- ENROLLMENTS
-- ============================================================

CREATE TABLE enrollments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  status enrollment_status NOT NULL DEFAULT 'active',
  stripe_payment_intent_id TEXT,
  amount_paid_cents INT DEFAULT 0,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, course_id)
);

-- ============================================================
-- LESSON PROGRESS
-- ============================================================

CREATE TABLE lesson_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  progress_seconds INT DEFAULT 0,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- ============================================================
-- QUIZ ATTEMPTS
-- ============================================================

CREATE TABLE quiz_attempts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  answers JSONB NOT NULL,
  score INT NOT NULL,
  passed BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER update_lesson_progress_updated_at
  BEFORE UPDATE ON lesson_progress
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_type ON courses(type);
CREATE INDEX idx_courses_slug ON courses(slug);
CREATE INDEX idx_lessons_module_id ON lessons(module_id);
CREATE INDEX idx_lessons_course_id ON lessons(course_id);
CREATE INDEX idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_lesson_progress_user_id ON lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_course_id ON lesson_progress(course_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Instructors - public read
CREATE POLICY "Anyone can view instructors" ON instructors FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage instructors" ON instructors FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Courses - public read for published
CREATE POLICY "Anyone can view published courses" ON courses FOR SELECT USING (status = 'published');
CREATE POLICY "Admins can manage courses" ON courses FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Modules - visible for enrolled users
CREATE POLICY "Anyone can view modules of published courses" ON modules FOR SELECT USING (
  EXISTS (SELECT 1 FROM courses WHERE id = modules.course_id AND status = 'published')
);
CREATE POLICY "Admins can manage modules" ON modules FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Lessons - preview visible to all, full content for enrolled
CREATE POLICY "Anyone can view preview lessons" ON lessons FOR SELECT USING (is_preview = TRUE);
CREATE POLICY "Enrolled users can view lessons" ON lessons FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM enrollments
    WHERE user_id = auth.uid() AND course_id = lessons.course_id AND status = 'active'
  )
);
CREATE POLICY "Admins can manage lessons" ON lessons FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Quiz questions - same as lessons
CREATE POLICY "Enrolled users can view quiz questions" ON quiz_questions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM lessons l
    JOIN enrollments e ON e.course_id = l.course_id
    WHERE l.id = quiz_questions.lesson_id AND e.user_id = auth.uid() AND e.status = 'active'
  )
);
CREATE POLICY "Admins can manage quiz questions" ON quiz_questions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Enrollments
CREATE POLICY "Users can view own enrollments" ON enrollments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all enrollments" ON enrollments FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can manage enrollments" ON enrollments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Lesson progress
CREATE POLICY "Users can manage own progress" ON lesson_progress FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admins can view all progress" ON lesson_progress FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Quiz attempts
CREATE POLICY "Users can manage own quiz attempts" ON quiz_attempts FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admins can view all quiz attempts" ON quiz_attempts FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- VIEWS
-- ============================================================

-- Course progress summary per user
CREATE OR REPLACE VIEW course_progress AS
SELECT
  e.user_id,
  e.course_id,
  c.title AS course_title,
  COUNT(l.id) AS total_lessons,
  COUNT(lp.id) FILTER (WHERE lp.completed = TRUE) AS completed_lessons,
  CASE
    WHEN COUNT(l.id) = 0 THEN 0
    ELSE ROUND(COUNT(lp.id) FILTER (WHERE lp.completed = TRUE)::NUMERIC / COUNT(l.id) * 100)
  END AS progress_percentage
FROM enrollments e
JOIN courses c ON c.id = e.course_id
LEFT JOIN lessons l ON l.course_id = e.course_id
LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = e.user_id
WHERE e.status = 'active'
GROUP BY e.user_id, e.course_id, c.title;
