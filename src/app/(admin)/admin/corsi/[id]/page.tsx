import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getTaxonomiesWithTerms } from '@/lib/taxonomy.server'
import CourseForm from '../CourseForm'
import ModulesManager from './ModulesManager'

export const dynamic = 'force-dynamic'

interface Props { params: { id: string } }

export default async function EditCorsoPage({ params }: Props) {
  const supabase = createServerClient()

  const [{ data: course }, { data: instructors }, { data: modules }, taxonomies, { data: courseTerms }] = await Promise.all([
    supabase.from('courses').select('*').eq('id', params.id).single(),
    supabase.from('instructors').select('id, full_name').order('full_name'),
    supabase.from('modules').select('*, lessons(*)').eq('course_id', params.id).order('sort_order'),
    getTaxonomiesWithTerms({ appliesToCourses: true }),
    supabase.from('course_terms').select('term_id').eq('course_id', params.id),
  ])

  if (!course) notFound()

  return (
    <div className="px-10 py-8 space-y-8">
      <div>
        <h1 className="font-bold text-white mb-8">Modifica corso</h1>
        <CourseForm
          instructors={instructors ?? []}
          course={course}
          taxonomies={taxonomies}
          initialTermIds={(courseTerms ?? []).map((t) => t.term_id)}
        />
      </div>

      <div>
        <h2 className="font-bold text-white mb-6">Moduli e lezioni</h2>
        <ModulesManager courseId={course.id} initialModules={modules ?? []} />
      </div>
    </div>
  )
}
