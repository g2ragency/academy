import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, BarChart2, BookOpen, Lock, Play, CheckCircle2, User } from 'lucide-react'
import { createServerClient, getProfile } from '@/lib/supabase/server'
import { CourseTypeBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatPrice, formatDuration, formatSeconds } from '@/lib/utils'
import type { Module, Lesson } from '@/types'
import EnrollButton from './EnrollButton'

export const dynamic = 'force-dynamic'

interface Props { params: { slug: string } }

// Nessun filtro su status: la RLS mostra le bozze solo agli admin,
// così l'anteprima da /admin/corsi funziona anche prima della pubblicazione
async function getCourse(slug: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('courses')
    .select('*, instructor:instructors(*)')
    .eq('slug', slug)
    .single()
  return data
}

async function getModules(courseId: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('modules')
    .select('*, lessons(*)')
    .eq('course_id', courseId)
    .order('sort_order')
  return (data ?? []) as (Module & { lessons: Lesson[] })[]
}

async function getEnrollment(userId: string, courseId: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('enrollments')
    .select('id, status')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single()
  return data
}

export async function generateMetadata({ params }: Props) {
  const course = await getCourse(params.slug)
  return { title: course?.title ?? 'Corso' }
}

export default async function CourseDetailPage({ params }: Props) {
  const course = await getCourse(params.slug)
  if (!course) notFound()

  const [modules, profile] = await Promise.all([
    getModules(course.id),
    getProfile(),
  ])

  const enrollment = profile ? await getEnrollment(profile.id, course.id) : null
  const isEnrolled = enrollment?.status === 'active'
  const totalLessons = modules.reduce((acc, m) => acc + (m.lessons?.length ?? 0), 0)

  return (
    <div className="min-h-screen bg-surface pt-24 pb-20">
      <div className="container-wide">
        {course.status !== 'published' && (
          <div className="mb-8 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
            Anteprima {course.status === 'draft' ? 'bozza' : 'corso archiviato'} — questa pagina è visibile solo agli admin finché il corso non è pubblicato.
          </div>
        )}
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <CourseTypeBadge type={course.type} />
              <h1 className="text-2xl lg:text-3xl font-bold text-white mt-3 mb-4 leading-tight">
                {course.title}
              </h1>
              {course.short_description && (
                <p className="text-white/60 text-lg leading-relaxed">{course.short_description}</p>
              )}

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-white/50">
                {course.instructor && (
                  <Link href={`/docenti/${course.instructor.slug}`} className="flex items-center gap-2 hover:text-white transition-colors">
                    <User className="w-4 h-4" />
                    {course.instructor.full_name}
                  </Link>
                )}
                {course.duration_minutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDuration(course.duration_minutes)}
                  </span>
                )}
                {course.level && (
                  <span className="flex items-center gap-1">
                    <BarChart2 className="w-4 h-4" />
                    <span className="capitalize">{course.level}</span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {totalLessons} lezioni
                </span>
              </div>
            </div>

            {/* Preview video */}
            {course.preview_video_url && (
              <div className="aspect-video bg-surface-elevated rounded-2xl overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center">
                    <div className="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[18px] border-l-brand ml-1" />
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            {course.description && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Descrizione del corso</h2>
                <div className="text-white/60 leading-relaxed whitespace-pre-line">{course.description}</div>
              </div>
            )}

            {/* Curriculum */}
            {modules.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Programma del corso</h2>
                <div className="space-y-3">
                  {modules.map((module) => (
                    <ModuleAccordion key={module.id} module={module} isEnrolled={isEnrolled} />
                  ))}
                </div>
              </div>
            )}

            {/* Instructor */}
            {course.instructor && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Il docente</h2>
                <Link href={`/docenti/${course.instructor.slug}`} className="flex items-start gap-4 card p-5 hover:border-white/10 transition-colors">
                  <div className="w-14 h-14 rounded-full bg-surface-elevated border border-surface-border shrink-0 overflow-hidden relative">
                    {course.instructor.avatar_url ? (
                      <Image src={course.instructor.avatar_url} alt={course.instructor.full_name} fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-white/40 font-bold text-lg">
                        {course.instructor.full_name[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{course.instructor.full_name}</p>
                    {course.instructor.title && <p className="text-sm text-white/50 mt-0.5">{course.instructor.title}</p>}
                    {course.instructor.bio && <p className="text-sm text-white/40 mt-2 line-clamp-3">{course.instructor.bio}</p>}
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar - enrollment card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="card p-6">
                {/* Thumbnail */}
                <div className="aspect-video bg-surface-elevated rounded-xl overflow-hidden relative mb-6">
                  {course.thumbnail_url ? (
                    <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="w-10 h-10 text-white/20" />
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="mb-6">
                  <p className="text-3xl font-bold text-white">{formatPrice(course.price_cents)}</p>
                </div>

                {/* CTA */}
                {isEnrolled ? (
                  <Link href={`/dashboard/corsi/${course.slug}`} className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-3">
                    <Play className="w-4 h-4" />
                    Continua a studiare
                  </Link>
                ) : (
                  <EnrollButton course={course} isLoggedIn={!!profile} />
                )}

                {/* Features */}
                <ul className="mt-6 space-y-2.5">
                  {[
                    { icon: Clock, label: course.duration_minutes ? `${formatDuration(course.duration_minutes)} di contenuto` : 'Accesso completo' },
                    { icon: BookOpen, label: `${totalLessons} lezioni` },
                    { icon: CheckCircle2, label: 'Accesso a vita' },
                  ].map((f) => (
                    <li key={f.label} className="flex items-center gap-2.5 text-sm text-white/50">
                      <f.icon className="w-4 h-4 text-brand shrink-0" />
                      {f.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ModuleAccordion({ module, isEnrolled }: { module: Module & { lessons: Lesson[] }; isEnrolled: boolean }) {
  const lessonCount = module.lessons?.length ?? 0
  return (
    <details className="card group">
      <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
        <div className="flex items-center gap-3">
          <span className="font-medium text-white text-sm">{module.title}</span>
          <span className="text-xs text-white/40">{lessonCount} lezioni</span>
        </div>
        <span className="text-white/40 text-xs">▾</span>
      </summary>
      <div className="border-t border-surface-border divide-y divide-surface-border">
        {module.lessons?.sort((a, b) => a.sort_order - b.sort_order).map((lesson) => (
          <div key={lesson.id} className="flex items-center gap-3 px-4 py-3">
            {isEnrolled || lesson.is_preview ? (
              <Play className="w-3.5 h-3.5 text-brand shrink-0" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-white/30 shrink-0" />
            )}
            <span className={`text-sm flex-1 ${isEnrolled || lesson.is_preview ? 'text-white/70' : 'text-white/40'}`}>
              {lesson.title}
              {lesson.is_preview && !isEnrolled && (
                <span className="ml-2 text-xs text-brand">Anteprima</span>
              )}
            </span>
            {lesson.duration_seconds && (
              <span className="text-xs text-white/30">{formatSeconds(lesson.duration_seconds)}</span>
            )}
          </div>
        ))}
      </div>
    </details>
  )
}
