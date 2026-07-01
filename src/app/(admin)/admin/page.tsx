import { createServerClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import { Users, BookOpen, TrendingUp, DollarSign, ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Admin Dashboard' }

export default async function AdminDashboard() {
  const supabase = createServerClient()

  const [
    { count: totalUsers },
    { count: totalCourses },
    { count: totalEnrollments },
    { data: recentEnrollments },
    { data: popularity },
    { data: payments },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('courses').select('id', { count: 'exact', head: true }),
    supabase.from('enrollments').select('id', { count: 'exact', head: true }),
    supabase
      .from('enrollments')
      .select('*, user:profiles(full_name, email), course:courses(title)')
      .order('enrolled_at', { ascending: false })
      .limit(10),
    supabase
      .from('course_popularity')
      .select('course_id, enrollment_count')
      .order('enrollment_count', { ascending: false })
      .limit(5),
    supabase
      .from('enrollments')
      .select('amount_paid_cents')
      .gt('amount_paid_cents', 0),
  ])

  // Top corsi per numero di iscrizioni (dalla view course_popularity)
  const popularIds = (popularity ?? []).map((p: any) => p.course_id)
  const { data: popularCourseRows } = popularIds.length
    ? await supabase.from('courses').select('id, title').in('id', popularIds)
    : { data: [] }
  const titleById = new Map((popularCourseRows ?? []).map((c: any) => [c.id, c.title]))
  const popularCourses = (popularity ?? []).map((p: any) => ({
    course_id: p.course_id,
    title: titleById.get(p.course_id) ?? '—',
    enrollment_count: p.enrollment_count,
  }))

  const revenueCents = (payments ?? []).reduce((acc: number, p: any) => acc + (p.amount_paid_cents ?? 0), 0)

  const stats = [
    { icon: Users, label: 'Utenti registrati', value: totalUsers ?? 0, color: 'text-blue-400' },
    { icon: BookOpen, label: 'Corsi pubblicati', value: totalCourses ?? 0, color: 'text-brand' },
    { icon: TrendingUp, label: 'Iscrizioni totali', value: totalEnrollments ?? 0, color: 'text-green-400' },
    { icon: DollarSign, label: 'Revenue', value: revenueCents > 0 ? formatPrice(revenueCents) : '0,00 €', color: 'text-purple-400' },
  ]

  return (
    <div className="px-10 py-8">
      <h4 className="font-bold text-white mb-8">Dashboard Admin</h4>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <div className={`w-9 h-9 rounded-xl bg-surface-elevated flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-[14px] text-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent enrollments */}
        <div className="card">
          <div className="p-5 border-b border-surface-border flex items-center justify-between gap-3">
            <h5 className="font-semibold text-white">Ultime iscrizioni</h5>
            <a
              href="https://dashboard.stripe.com/payments"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors shrink-0"
            >
              Ordini e rimborsi su Stripe
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="divide-y divide-surface-border">
            {(recentEnrollments ?? []).slice(0, 8).map((e: any) => (
              <div key={e.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-full bg-surface-elevated border border-surface-border flex items-center justify-center text-xs font-semibold text-white/60 shrink-0">
                  {e.user?.full_name?.[0] ?? e.user?.email?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] text-white truncate">{e.user?.full_name ?? e.user?.email}</p>
                  <p className="text-[14px] text-muted truncate">{e.course?.title}</p>
                </div>
                <span className="text-[13px] text-white/30 shrink-0">
                  {new Date(e.enrolled_at).toLocaleDateString('it-IT')}
                </span>
              </div>
            ))}
            {!(recentEnrollments?.length) && (
              <p className="px-5 py-6 text-[16px] text-white/30 text-center">Nessuna iscrizione</p>
            )}
          </div>
        </div>

        {/* Popular courses */}
        <div className="card">
          <div className="p-5 border-b border-surface-border flex items-center justify-between">
            <h5 className="font-semibold text-white">Corsi più iscritti</h5>
          </div>
          <div className="divide-y divide-surface-border">
            {(popularCourses ?? []).map((e: any, i: number) => (
              <div key={e.course_id ?? i} className="flex items-center gap-3 px-5 py-3">
                <span className="text-[16px] font-bold text-white/20 w-6 shrink-0">#{i + 1}</span>
                <p className="text-[16px] text-white/70 flex-1 truncate">{e.title}</p>
                <span className="text-[13px] text-white/30 shrink-0">{e.enrollment_count} iscritti</span>
              </div>
            ))}
            {!(popularCourses?.length) && (
              <p className="px-5 py-6 text-[16px] text-white/30 text-center">Nessun dato</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
