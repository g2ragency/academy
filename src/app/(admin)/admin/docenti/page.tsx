import Link from 'next/link'
import Image from 'next/image'
import { Plus, Edit2, User } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import InstructorFormModal from './InstructorFormModal'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Gestione Docenti' }

export default async function AdminDocentiPage() {
  const supabase = createServerClient()
  const { data: instructors } = await supabase
    .from('instructors')
    .select('*')
    .order('sort_order')

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Gestione Docenti</h1>
        <InstructorFormModal />
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
                <p className="font-semibold text-white text-sm leading-tight">{instructor.full_name}</p>
                {instructor.title && <p className="text-xs text-white/50 mt-0.5 line-clamp-1">{instructor.title}</p>}
              </div>
            </div>
            <div className="p-3 flex justify-end">
              <InstructorFormModal instructor={instructor} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
