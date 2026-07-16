import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { createServerClient, getProfile } from '@/lib/supabase/server'
import { getMediaUrl } from '@/lib/media'
import { getRelatedCourses } from '@/lib/courses.server'
import CoursePlayer from '@/components/courses/CoursePlayer'
import type { Module, Lesson, LessonProgress, Instructor, LessonChapter, QuizQuestion } from '@/types'

export const dynamic = 'force-dynamic'

interface Props { params: { slug: string } }

type LessonFull = Lesson & { quiz_questions?: QuizQuestion[]; chapters?: LessonChapter[] }

/**
 * Pagina di VISUALIZZAZIONE del corso (utente iscritto). Vive nel gruppo
 * (public) → stesso layout/shell della pagina-corso pubblica, NON dentro la
 * shell dell'area riservata. Un unico [[CoursePlayer]] copre sia il corso a
 * video-unico (sidebar capitoli) sia quello a moduli (sidebar moduli, video
 * inline). Gli ingressi ("Continua a studiare", "I miei corsi") reindirizzano qui.
 */
export default async function WatchCoursePage({ params }: Props) {
  const profile = await getProfile()
  if (!profile) redirect(`/auth/login?redirect=/corsi/${params.slug}/guarda`)

  const supabase = createServerClient()

  const { data: course } = await supabase
    .from('courses')
    // Hint FK necessario: courses→instructors ha due percorsi (FK diretta e junction course_instructors)
    .select('*, instructor:instructors!courses_instructor_id_fkey(*), course_instructors(sort_order, instructor:instructors(*))')
    .eq('slug', params.slug)
    .single()

  if (!course) notFound()

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id, status')
    .eq('user_id', profile.id)
    .eq('course_id', course.id)
    .single()

  if (!enrollment || enrollment.status !== 'active') {
    redirect(`/corsi/${params.slug}`)
  }

  const [{ data: modules }, { data: progressData }, { data: lessonState }, relatedCourses] = await Promise.all([
    supabase
      .from('modules')
      .select('*, lessons(*, quiz_questions(*), chapters:lesson_chapters(*))')
      .eq('course_id', course.id)
      .order('sort_order'),
    supabase
      .from('lesson_progress')
      .select('*')
      .eq('user_id', profile.id)
      .eq('course_id', course.id),
    // Sblocco sequenziale dei corsi accreditati: la regola vive nel server
    // (tempo netto dai log immutabili), la pagina la legge e basta.
    supabase.rpc('course_lesson_state', { p_course_id: course.id }),
    getRelatedCourses(course.id),
  ])

  // Relatori: junction course_instructors, fallback sul docente singolo legacy
  const relatori: Instructor[] = (course.course_instructors ?? [])
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
    .map((row: any) => row.instructor)
    .filter(Boolean)
  if (relatori.length === 0 && course.instructor) relatori.push(course.instructor)

  return (
    <div className="min-h-screen bg-surface pt-16 lg:pt-24 pb-20">
      <div className="container-wide">
        <div className="flex items-center gap-2 text-sm text-white/40 mb-6">
          <Link href="/dashboard" className="hover:text-white transition-colors">I miei corsi</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-white/70">{course.title}</span>
        </div>

        <CoursePlayer
          course={{
            id: course.id,
            slug: course.slug,
            title: course.title,
            issues_certificate: course.issues_certificate,
            description: course.description,
            fpc_accredited: course.fpc_accredited ?? false,
          }}
          modules={(modules ?? []) as (Module & { lessons: LessonFull[] })[]}
          userId={profile.id}
          poster={getMediaUrl(course.thumbnail_url)}
          progressList={(progressData ?? []) as LessonProgress[]}
          lessonState={lessonState ?? []}
          instructors={relatori}
          relatedCourses={relatedCourses}
        />
      </div>
    </div>
  )
}
