import { createServerClient } from '@/lib/supabase/server'
import AndamentoTable, { type ProgressRow } from './AndamentoTable'
import type { Profile } from '@/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Andamento corsi' }

interface ProgressView {
  user_id: string
  course_id: string
  course_title: string
  total_lessons: number
  completed_lessons: number
  progress_percentage: number
}

export default async function AdminAndamentoPage() {
  const supabase = createServerClient()
  const [{ data: progress }, { data: profiles }] = await Promise.all([
    supabase.from('course_progress').select('*'),
    supabase.from('profiles').select('id, full_name, email'),
  ])

  const byId = new Map<string, Pick<Profile, 'full_name' | 'email'>>(
    (profiles ?? []).map((p) => [p.id, p as Pick<Profile, 'full_name' | 'email'>])
  )

  const rows: ProgressRow[] = ((progress ?? []) as ProgressView[])
    .map((p) => ({
      userName: byId.get(p.user_id)?.full_name ?? '—',
      email: byId.get(p.user_id)?.email ?? '',
      courseTitle: p.course_title,
      completedLessons: p.completed_lessons,
      totalLessons: p.total_lessons,
      progress: p.progress_percentage,
    }))
    .sort((a, b) => b.progress - a.progress || a.userName.localeCompare(b.userName))

  return (
    <div className="px-10 py-8">
      <AndamentoTable rows={rows} />
    </div>
  )
}
