import { createServerClient } from '@/lib/supabase/server'
import CourseForm from '../CourseForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Nuovo Corso' }

export default async function NuovoCorsoPage() {
  const supabase = createServerClient()
  const { data: instructors } = await supabase.from('instructors').select('id, full_name').order('full_name')

  return (
    <div className="px-10 py-8">
      <h1 className="font-bold text-white mb-8">Nuovo corso</h1>
      <CourseForm instructors={instructors ?? []} />
    </div>
  )
}
