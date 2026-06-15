import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createServerClient, getProfile } from '@/lib/supabase/server'
import MyCoursesTabs, { type EnrolledItem } from './MyCoursesTabs'
import ClearCartOnSuccess from './ClearCartOnSuccess'
import type { Course, CourseProgress, Enrollment } from '@/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Corsi' }

export default async function DashboardPage() {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')

  const supabase = createServerClient()

  const [{ data: enrollments }, { data: progress }, { data: popularity }] = await Promise.all([
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
    supabase.from('course_popularity').select('course_id, enrollment_count'),
  ])

  const progressMap = new Map<string, number>(
    (progress ?? []).map((p: CourseProgress) => [p.course_id, p.progress_percentage])
  )

  const enrolled: EnrolledItem[] = ((enrollments ?? []) as (Enrollment & { course: Course })[])
    .filter((e) => e.course)
    .map((e) => ({ course: e.course, progress: progressMap.get(e.course_id) ?? 0 }))

  // "Adatti a te": corsi pubblicati non acquistati, ordinati per popolarità poi evidenza
  const enrolledIds = new Set(enrolled.map((e) => e.course.id))
  const counts = new Map<string, number>(
    (popularity ?? []).map((p: any) => [p.course_id, p.enrollment_count])
  )
  const { data: allCourses } = await supabase
    .from('courses')
    .select('*')
    .eq('status', 'published')
  const recommended = ((allCourses ?? []) as Course[])
    .filter((c) => !enrolledIds.has(c.id))
    .sort(
      (a, b) =>
        (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) ||
        Number(b.featured) - Number(a.featured) ||
        a.sort_order - b.sort_order
    )
    .slice(0, 6)

  return (
    <div className="px-10 py-8">
      <Suspense fallback={null}>
        <ClearCartOnSuccess />
      </Suspense>
      <h5 className="text-white mb-8">Corsi</h5>
      <MyCoursesTabs enrolled={enrolled} recommended={recommended} />
    </div>
  )
}
