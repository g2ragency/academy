import { createServerClient } from '@/lib/supabase/server'
import { getTaxonomiesWithTerms } from '@/lib/taxonomy.server'
import CoursesExplorer, { type CourseWithTerms } from './CoursesExplorer'
import type { Course } from '@/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Corsi' }

interface Props {
  searchParams: Record<string, string | undefined>
}

/** Tutti i corsi pubblicati + gli id dei term associati (per il filtraggio
 *  client-side istantaneo in CoursesExplorer). */
async function getCoursesWithTerms(): Promise<CourseWithTerms[]> {
  const supabase = createServerClient()
  const [{ data: courses }, { data: courseTerms }] = await Promise.all([
    supabase
      .from('courses')
      .select('*, instructor:instructors!courses_instructor_id_fkey(*)')
      .eq('status', 'published')
      .order('sort_order', { ascending: true }),
    supabase.from('course_terms').select('course_id, term_id'),
  ])

  const termsByCourse = new Map<string, string[]>()
  for (const row of courseTerms ?? []) {
    const list = termsByCourse.get(row.course_id) ?? []
    list.push(row.term_id)
    termsByCourse.set(row.course_id, list)
  }

  return ((courses ?? []) as Course[]).map((c) => ({
    ...c,
    termIds: termsByCourse.get(c.id) ?? [],
  }))
}

export default async function CorsiPage({ searchParams }: Props) {
  const [taxonomies, courses] = await Promise.all([
    getTaxonomiesWithTerms({ showInFilters: true, appliesToCourses: true }),
    getCoursesWithTerms(),
  ])

  return (
    <div className="min-h-screen bg-surface pt-24 pb-20">
      <div className="container-wide">
        <CoursesExplorer courses={courses} taxonomies={taxonomies} initial={searchParams} />
      </div>
    </div>
  )
}
