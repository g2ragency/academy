import { createServerClient } from '@/lib/supabase/server'
import type { Course } from '@/types'

/** Corsi più seguiti dagli altri utenti (view aggregata course_popularity), escluso il corrente */
export async function getRelatedCourses(excludeId: string): Promise<Course[]> {
  const supabase = createServerClient()
  const [{ data: courses }, { data: popularity }] = await Promise.all([
    supabase.from('courses').select('*').eq('status', 'published').neq('id', excludeId),
    supabase.from('course_popularity').select('*'),
  ])
  const counts = new Map<string, number>(
    (popularity ?? []).map((p: any) => [p.course_id, p.enrollment_count])
  )
  return ((courses ?? []) as Course[])
    .sort(
      (a, b) =>
        (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) || a.sort_order - b.sort_order
    )
    .slice(0, 4)
}
