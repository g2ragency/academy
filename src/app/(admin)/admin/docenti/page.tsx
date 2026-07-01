import Image from 'next/image'
import { User } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { getTaxonomiesWithTerms } from '@/lib/taxonomy.server'
import InstructorFormModal from './InstructorFormModal'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Gestione Docenti' }

export default async function AdminDocentiPage() {
  const supabase = createServerClient()
  const [{ data: instructors }, taxonomies, { data: instructorTerms }] = await Promise.all([
    supabase.from('instructors').select('*').order('sort_order'),
    getTaxonomiesWithTerms({ appliesToInstructors: true }),
    supabase.from('instructor_terms').select('instructor_id, term_id'),
  ])

  const termIdsByInstructor = new Map<string, string[]>()
  for (const row of instructorTerms ?? []) {
    const list = termIdsByInstructor.get(row.instructor_id) ?? []
    list.push(row.term_id)
    termIdsByInstructor.set(row.instructor_id, list)
  }

  return (
    <div className="px-10 py-8">
      <div className="flex items-center justify-between mb-8">
        <h4 className="font-bold text-white">Gestione Docenti</h4>
        <InstructorFormModal taxonomies={taxonomies} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {(instructors ?? []).map((instructor: any) => (
          <div key={instructor.id} className="card group overflow-hidden">
            <div className="aspect-[3/4] relative overflow-hidden bg-surface-elevated">
              {instructor.avatar_url ? (
                <Image src={instructor.avatar_url} alt={instructor.full_name} fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <User className="w-12 h-12 text-white/10" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-white text-[16px] leading-tight">{instructor.full_name}</p>
                {instructor.title && <p className="text-[14px] text-muted mt-0.5 line-clamp-1">{instructor.title}</p>}
              </div>
            </div>
            <div className="p-3 flex justify-end">
              <InstructorFormModal
                instructor={instructor}
                taxonomies={taxonomies}
                initialTermIds={termIdsByInstructor.get(instructor.id) ?? []}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
