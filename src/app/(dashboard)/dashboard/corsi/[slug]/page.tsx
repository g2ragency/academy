import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Play, CheckCircle2, Lock, ChevronRight } from 'lucide-react'
import { createServerClient, getProfile } from '@/lib/supabase/server'
import { Progress } from '@/components/ui/Progress'
import { CourseTypeBadge } from '@/components/ui/Badge'
import { formatSeconds } from '@/lib/utils'
import type { Module, Lesson, LessonProgress } from '@/types'

export const dynamic = 'force-dynamic'

interface Props { params: { slug: string } }

export default async function CoursePlayerPage({ params }: Props) {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')

  const supabase = createServerClient()

  const { data: course } = await supabase
    .from('courses')
    .select('*, instructor:instructors(*)')
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

  const [{ data: modules }, { data: progressData }] = await Promise.all([
    supabase
      .from('modules')
      .select('*, lessons(*)')
      .eq('course_id', course.id)
      .order('sort_order'),
    supabase
      .from('lesson_progress')
      .select('*')
      .eq('user_id', profile.id)
      .eq('course_id', course.id),
  ])

  const progressMap = new Map<string, LessonProgress>(
    (progressData ?? []).map((p: LessonProgress) => [p.lesson_id, p])
  )

  const allModules = (modules ?? []) as (Module & { lessons: Lesson[] })[]
  const allLessons = allModules.flatMap((m) => m.lessons ?? []).sort((a, b) => a.sort_order - b.sort_order)
  const totalLessons = allLessons.length
  const completedLessons = allLessons.filter((l) => progressMap.get(l.id)?.completed).length
  const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  // First incomplete lesson
  const nextLesson = allLessons.find((l) => !progressMap.get(l.id)?.completed) ?? allLessons[0]

  return (
    <div className="py-10">
      <div className="container-wide">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-white/40 mb-3">
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white/70">{course.title}</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CourseTypeBadge type={course.type} />
              <h1 className="font-bold text-white mt-2">{course.title}</h1>
            </div>
          </div>

          {/* Overall progress */}
          <div className="mt-4 card p-4">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-white/60">{completedLessons}/{totalLessons} lezioni completate</span>
              <span className="text-brand font-medium">{progressPct}%</span>
            </div>
            <Progress value={progressPct} />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main area - next lesson CTA */}
          <div className="lg:col-span-2 space-y-6">
            {nextLesson && (
              <Link
                href={`/dashboard/corsi/${params.slug}/lezione/${nextLesson.id}`}
                className="card p-6 flex items-center gap-4 hover:border-brand/30 transition-colors group"
              >
                <div className="w-14 h-14 rounded-2xl bg-brand/20 border border-brand/30 flex items-center justify-center shrink-0 group-hover:bg-brand/30 transition-colors">
                  <Play className="w-6 h-6 text-brand" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-white/40 mb-1">
                    {completedLessons === 0 ? 'Inizia da qui' : 'Continua'}
                  </p>
                  <p className="font-semibold text-white group-hover:text-brand transition-colors">
                    {nextLesson.title}
                  </p>
                  {nextLesson.duration_seconds && (
                    <p className="text-xs text-white/40 mt-1">{formatSeconds(nextLesson.duration_seconds)}</p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-brand transition-colors" />
              </Link>
            )}
          </div>

          {/* Curriculum sidebar */}
          <div className="lg:col-span-1">
            <h2 className="font-semibold text-white mb-4">Programma</h2>
            <div className="space-y-3">
              {allModules.map((module) => (
                <div key={module.id} className="card">
                  <div className="px-4 py-3 border-b border-surface-border">
                    <p className="text-sm font-medium text-white/80">{module.title}</p>
                  </div>
                  <div className="divide-y divide-surface-border">
                    {(module.lessons ?? []).sort((a, b) => a.sort_order - b.sort_order).map((lesson) => {
                      const lp = progressMap.get(lesson.id)
                      const isCompleted = lp?.completed ?? false
                      return (
                        <Link
                          key={lesson.id}
                          href={`/dashboard/corsi/${params.slug}/lezione/${lesson.id}`}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-surface-elevated transition-colors group"
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                          ) : (
                            <Play className="w-4 h-4 text-white/30 shrink-0 group-hover:text-white/60" />
                          )}
                          <span className={`text-sm flex-1 line-clamp-1 ${isCompleted ? 'text-white/50' : 'text-white/70 group-hover:text-white'}`}>
                            {lesson.title}
                          </span>
                          {lesson.duration_seconds && (
                            <span className="text-xs text-white/30 shrink-0">{formatSeconds(lesson.duration_seconds)}</span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
