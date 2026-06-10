import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, CheckCircle2, FileText, BookOpen } from 'lucide-react'
import { createServerClient, getProfile } from '@/lib/supabase/server'
import LessonPlayer from './LessonPlayer'
import type { Module, Lesson, LessonProgress } from '@/types'

export const dynamic = 'force-dynamic'

interface Props { params: { slug: string; lessonId: string } }

export default async function LessonPage({ params }: Props) {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')

  const supabase = createServerClient()

  const { data: course } = await supabase
    .from('courses')
    .select('id, title, slug, type')
    .eq('slug', params.slug)
    .single()

  if (!course) notFound()

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', profile.id)
    .eq('course_id', course.id)
    .single()

  if (!enrollment) redirect(`/corsi/${params.slug}`)

  const [{ data: lesson }, { data: modules }, { data: progressData }] = await Promise.all([
    supabase
      .from('lessons')
      .select('*, quiz_questions(*)')
      .eq('id', params.lessonId)
      .single(),
    supabase
      .from('modules')
      .select('*, lessons(id, title, sort_order, duration_seconds, type)')
      .eq('course_id', course.id)
      .order('sort_order'),
    supabase
      .from('lesson_progress')
      .select('*')
      .eq('user_id', profile.id)
      .eq('course_id', course.id),
  ])

  if (!lesson) notFound()

  const allLessons = ((modules ?? []) as (Module & { lessons: Lesson[] })[])
    .flatMap((m) => m.lessons ?? [])
    .sort((a, b) => a.sort_order - b.sort_order)

  const currentIndex = allLessons.findIndex((l) => l.id === params.lessonId)
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null

  const progressMap = new Map<string, LessonProgress>(
    (progressData ?? []).map((p: LessonProgress) => [p.lesson_id, p])
  )
  const isCompleted = progressMap.get(params.lessonId)?.completed ?? false

  return (
    <div className="h-full bg-surface">
      <div className="flex h-full">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-72 border-r border-surface-border flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b border-surface-border">
            <Link href={`/dashboard/corsi/${params.slug}`} className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
              <ChevronLeft className="w-4 h-4" />
              {course.title}
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            {((modules ?? []) as (Module & { lessons: Lesson[] })[]).map((module) => (
              <div key={module.id}>
                <div className="px-4 py-3 border-b border-surface-border bg-surface-card">
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-wide">{module.title}</p>
                </div>
                {(module.lessons ?? []).sort((a, b) => a.sort_order - b.sort_order).map((l) => {
                  const isActive = l.id === params.lessonId
                  const done = progressMap.get(l.id)?.completed
                  return (
                    <Link
                      key={l.id}
                      href={`/dashboard/corsi/${params.slug}/lezione/${l.id}`}
                      className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${isActive ? 'bg-brand/10 border-r-2 border-brand' : 'hover:bg-surface-elevated border-r-2 border-transparent'}`}
                    >
                      {done ? (
                        <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                      ) : (
                        <div className={`w-4 h-4 rounded-full border shrink-0 ${isActive ? 'border-brand' : 'border-white/20'}`} />
                      )}
                      <span className={`line-clamp-2 ${isActive ? 'text-white font-medium' : 'text-white/60'}`}>{l.title}</span>
                    </Link>
                  )
                })}
              </div>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <LessonPlayer
            lesson={lesson}
            courseId={course.id}
            courseSlug={params.slug}
            userId={profile.id}
            isCompleted={isCompleted}
            prevLesson={prevLesson ? { id: prevLesson.id, title: prevLesson.title } : null}
            nextLesson={nextLesson ? { id: nextLesson.id, title: nextLesson.title } : null}
          />
        </div>
      </div>
    </div>
  )
}
