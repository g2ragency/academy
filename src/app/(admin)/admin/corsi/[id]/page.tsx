import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import CourseForm from '../CourseForm'
import ModulesManager from './ModulesManager'

export const dynamic = 'force-dynamic'

interface Props { params: { id: string } }

export default async function EditCorsoPage({ params }: Props) {
  const supabase = createServerClient()

  const [{ data: course }, { data: instructors }, { data: modules }] = await Promise.all([
    supabase.from('courses').select('*').eq('id', params.id).single(),
    supabase.from('instructors').select('id, full_name').order('full_name'),
    supabase.from('modules').select('*, lessons(*)').eq('course_id', params.id).order('sort_order'),
  ])

  if (!course) notFound()

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-8">Modifica corso</h1>
        <CourseForm instructors={instructors ?? []} course={course} />
      </div>

      <div>
        <h2 className="text-xl font-bold text-white mb-6">Moduli e lezioni</h2>
        <ModulesManager courseId={course.id} initialModules={modules ?? []} />
      </div>
    </div>
  )
}
