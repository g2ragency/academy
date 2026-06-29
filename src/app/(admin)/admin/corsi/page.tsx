import Link from 'next/link'
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { CourseTypeBadge } from '@/components/ui/Badge'
import { formatPrice } from '@/lib/utils'
import DeleteCourseButton from './DeleteCourseButton'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Gestione Corsi' }

export default async function AdminCorsiPage() {
  const supabase = createServerClient()
  const { data: courses } = await supabase
    .from('courses')
    .select('*, instructor:instructors!courses_instructor_id_fkey(full_name)')
    .order('created_at', { ascending: false })

  return (
    <div className="px-10 py-8">
      <div className="flex items-center justify-between mb-8">
        <h4 className="font-bold text-white">Gestione Corsi</h4>
        <Link href="/admin/corsi/nuovo" className="btn-primary text-sm gap-2 inline-flex items-center">
          <Plus className="w-4 h-4" />
          Nuovo corso
        </Link>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide">Titolo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide">Docente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide">Prezzo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide">Stato</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {(courses ?? []).map((course: any) => (
                <tr key={course.id} className="hover:bg-surface-elevated transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-white max-w-[250px] truncate">{course.title}</p>
                    <p className="text-xs text-white/30">{course.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <CourseTypeBadge type={course.type} />
                  </td>
                  <td className="px-4 py-3 text-sm text-white/60">
                    {course.instructor?.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-white/60">
                    {formatPrice(course.price_cents)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${course.status === 'published' ? 'bg-green-500/20 text-green-400 border-green-500/30' : course.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-surface-elevated text-white/40 border-surface-border'}`}>
                      {course.status === 'published' ? 'Pubblicato' : course.status === 'draft' ? 'Bozza' : 'Archiviato'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/corsi/${course.slug}`} target="_blank" className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-surface-elevated transition-colors">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link href={`/admin/corsi/${course.id}`} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-surface-elevated transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <DeleteCourseButton courseId={course.id} courseTitle={course.title} />
                    </div>
                  </td>
                </tr>
              ))}
              {!(courses?.length) && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-white/30 text-sm">
                    Nessun corso ancora. <Link href="/admin/corsi/nuovo" className="text-brand hover:underline">Creane uno</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
