import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, Clock, TrendingUp, Play } from 'lucide-react'
import { createServerClient, getProfile } from '@/lib/supabase/server'
import { Progress } from '@/components/ui/Progress'
import { CourseTypeBadge } from '@/components/ui/Badge'
import { formatDuration } from '@/lib/utils'
import type { Course, CourseProgress, Enrollment } from '@/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')

  const supabase = createServerClient()

  const [{ data: enrollments }, { data: progress }] = await Promise.all([
    supabase
      .from('enrollments')
      .select('*, course:courses(*, instructor:instructors!courses_instructor_id_fkey(*))')
      .eq('user_id', profile.id)
      .eq('status', 'active')
      .order('enrolled_at', { ascending: false }),
    supabase
      .from('course_progress')
      .select('*')
      .eq('user_id', profile.id),
  ])

  const progressMap = new Map<string, CourseProgress>(
    (progress ?? []).map((p: CourseProgress) => [p.course_id, p])
  )

  const enrolledCourses = (enrollments ?? []) as (Enrollment & { course: Course })[]
  const completedCount = enrolledCourses.filter((e) => (progressMap.get(e.course_id)?.progress_percentage ?? 0) === 100).length
  const inProgressCount = enrolledCourses.filter((e) => {
    const p = progressMap.get(e.course_id)?.progress_percentage ?? 0
    return p > 0 && p < 100
  }).length

  return (
    <div className="py-10">
      <div className="container-wide">
        {/* Welcome */}
        <div className="mb-10">
          <h1 className="font-bold text-white">
            Ciao, {profile.full_name?.split(' ')[0] ?? 'utente'} 👋
          </h1>
          <p className="text-white/50 mt-1">Continua il tuo percorso formativo.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: BookOpen, label: 'Corsi iscritti', value: enrolledCourses.length, color: 'text-blue-400' },
            { icon: TrendingUp, label: 'In corso', value: inProgressCount, color: 'text-brand' },
            { icon: Clock, label: 'Completati', value: completedCount, color: 'text-green-400' },
          ].map((stat) => (
            <div key={stat.label} className="card p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl bg-surface-elevated flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/40">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* My courses */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-white">I miei corsi</h2>
            <Link href="/corsi" className="text-sm text-brand hover:text-brand-light transition-colors">
              Scopri altri corsi →
            </Link>
          </div>

          {enrolledCourses.length === 0 ? (
            <div className="card p-12 text-center">
              <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/50 mb-4">Non sei ancora iscritto a nessun corso.</p>
              <Link href="/corsi" className="btn-primary inline-flex text-sm">
                Esplora i corsi
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrolledCourses.map(({ course, course_id }) => {
                const prog = progressMap.get(course_id)
                const pct = prog?.progress_percentage ?? 0
                return (
                  <Link
                    key={course_id}
                    href={`/dashboard/corsi/${course.slug}`}
                    className="card group hover:border-white/10 transition-all duration-300 flex flex-col"
                  >
                    <div className="aspect-video bg-surface-elevated relative overflow-hidden shrink-0">
                      {course.thumbnail_url ? (
                        <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Play className="w-10 h-10 text-white/10" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute top-2 left-2">
                        <CourseTypeBadge type={course.type} />
                      </div>
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-semibold text-white leading-snug mb-3 group-hover:text-brand transition-colors flex-1 line-clamp-2">
                        {course.title}
                      </h3>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-white/40">
                          <span>{pct === 100 ? '✓ Completato' : pct > 0 ? 'In corso' : 'Non iniziato'}</span>
                          <span>{pct}%</span>
                        </div>
                        <Progress value={pct} />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
