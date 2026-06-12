export type CourseType = 'webinar' | 'masterclass' | 'fast_focus' | 'short_master' | 'executive_master'
export type CourseStatus = 'draft' | 'published' | 'archived'
export type LessonType = 'video' | 'text' | 'pdf' | 'quiz'
export type EnrollmentStatus = 'active' | 'expired' | 'cancelled'
export type UserRole = 'user' | 'admin'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  role: UserRole
  company: string | null
  bio: string | null
  website: string | null
  stripe_customer_id: string | null
  tax_code: string | null
  vat_number: string | null
  sdi_code: string | null
  billing_address: string | null
  created_at: string
  updated_at: string
}

export interface Instructor {
  id: string
  full_name: string
  slug: string
  bio: string | null
  avatar_url: string | null
  title: string | null
  linkedin_url: string | null
  sort_order: number
  created_at: string
}

export interface Course {
  id: string
  title: string
  slug: string
  description: string | null
  short_description: string | null
  thumbnail_url: string | null
  preview_video_url: string | null
  type: CourseType
  status: CourseStatus
  price_cents: number
  stripe_price_id: string | null
  instructor_id: string | null
  duration_minutes: number | null
  level: 'base' | 'intermedio' | 'avanzato' | null
  /** @deprecated sostituito dalla tassonomia dinamica (course_terms) */
  tags: string[] | null
  featured: boolean
  issues_certificate: boolean
  sort_order: number
  created_at: string
  updated_at: string
  instructor?: Instructor
}

export interface Certificate {
  id: string
  user_id: string
  course_id: string
  certificate_number: string
  issued_at: string
  course?: Course
}

export interface Module {
  id: string
  course_id: string
  title: string
  sort_order: number
  created_at: string
  lessons?: Lesson[]
}

export interface Lesson {
  id: string
  module_id: string
  course_id: string
  title: string
  type: LessonType
  content: string | null
  video_url: string | null
  pdf_url: string | null
  duration_seconds: number | null
  sort_order: number
  is_preview: boolean
  created_at: string
  updated_at: string
  quiz_questions?: QuizQuestion[]
}

export interface Taxonomy {
  id: string
  name: string
  slug: string
  description: string | null
  applies_to_courses: boolean
  applies_to_instructors: boolean
  show_in_filters: boolean
  show_in_home: boolean
  sort_order: number
  created_at: string
  terms?: Term[]
}

export interface Term {
  id: string
  taxonomy_id: string
  parent_id: string | null
  name: string
  slug: string
  sort_order: number
  created_at: string
  children?: Term[]
}

export interface QuizQuestion {
  id: string
  lesson_id: string
  question: string
  options: string[]
  correct_option_index: number
  explanation: string | null
  sort_order: number
}

export interface Enrollment {
  id: string
  user_id: string
  course_id: string
  status: EnrollmentStatus
  stripe_payment_intent_id: string | null
  amount_paid_cents: number
  enrolled_at: string
  expires_at: string | null
  course?: Course
}

export interface LessonProgress {
  id: string
  user_id: string
  lesson_id: string
  course_id: string
  completed: boolean
  progress_seconds: number
  completed_at: string | null
  updated_at: string
}

export interface QuizAttempt {
  id: string
  user_id: string
  lesson_id: string
  answers: number[]
  score: number
  passed: boolean
  attempted_at: string
}

export interface CourseProgress {
  user_id: string
  course_id: string
  course_title: string
  total_lessons: number
  completed_lessons: number
  progress_percentage: number
}

export const COURSE_TYPE_LABELS: Record<CourseType, string> = {
  webinar: 'Webinar',
  masterclass: 'Masterclass',
  fast_focus: 'Fast Focus',
  short_master: 'Short Master',
  executive_master: 'Executive Master',
}

export const COURSE_TYPE_COLORS: Record<CourseType, string> = {
  webinar: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  masterclass: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  fast_focus: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  short_master: 'bg-green-500/20 text-green-400 border-green-500/30',
  executive_master: 'bg-brand/20 text-brand border-brand/30',
}
