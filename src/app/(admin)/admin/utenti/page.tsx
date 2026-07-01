import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { createServerClient, getProfile } from '@/lib/supabase/server'
import UsersTable, { type UserRow } from './UsersTable'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Gestione Utenti' }

const PER_PAGE = 20

export default async function AdminUtentiPage({ searchParams }: { searchParams: { page?: string } }) {
  const supabase = createServerClient()
  const page = Math.max(1, Number(searchParams.page) || 1)
  const from = (page - 1) * PER_PAGE

  const [{ data: users, count }, me] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        '*, enrollments:enrollments(id, status, amount_paid_cents, enrolled_at, stripe_payment_intent_id, course:courses(title, slug))',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(from, from + PER_PAGE - 1),
    getProfile(),
  ])

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))

  return (
    <div className="px-10 py-8">
      <div className="flex items-baseline justify-between mb-8">
        <h4 className="font-bold text-white">Gestione Utenti</h4>
        <span className="text-sm text-white/40">{total} utenti</span>
      </div>

      <UsersTable users={(users ?? []) as UserRow[]} meId={me?.id} />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <PagerLink page={page - 1} disabled={page <= 1}>
            <ChevronLeft className="w-4 h-4" /> Precedente
          </PagerLink>
          <span className="text-sm text-white/50">Pagina {page} di {totalPages}</span>
          <PagerLink page={page + 1} disabled={page >= totalPages}>
            Successiva <ChevronRight className="w-4 h-4" />
          </PagerLink>
        </div>
      )}
    </div>
  )
}

function PagerLink({ page, disabled, children }: { page: number; disabled: boolean; children: React.ReactNode }) {
  const cls = 'inline-flex items-center gap-1.5 h-10 px-4 rounded-[10px] text-sm border border-surface-border transition-colors'
  if (disabled) {
    return <span className={`${cls} text-white/20 cursor-not-allowed`}>{children}</span>
  }
  return (
    <Link href={`/admin/utenti?page=${page}`} className={`${cls} text-white/70 hover:text-white hover:border-white/30`}>
      {children}
    </Link>
  )
}
