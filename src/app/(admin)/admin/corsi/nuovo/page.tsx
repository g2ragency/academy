import { createServerClient } from '@/lib/supabase/server'
import { getTaxonomiesWithTerms } from '@/lib/taxonomy.server'
import CourseForm from '../CourseForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Nuovo Corso' }

export default async function NuovoCorsoPage() {
  const supabase = createServerClient()
  const [{ data: instructors }, taxonomies] = await Promise.all([
    supabase.from('instructors').select('id, full_name').order('full_name'),
    getTaxonomiesWithTerms({ appliesToCourses: true }),
  ])

  return (
    <div className="px-10 py-8">
      <h1 className="font-bold text-white mb-8">Nuovo corso</h1>
      <CourseForm instructors={instructors ?? []} taxonomies={taxonomies} initialTermIds={[]} />
    </div>
  )
}
