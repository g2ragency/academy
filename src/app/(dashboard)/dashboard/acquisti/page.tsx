import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CreditCard, Receipt } from 'lucide-react'
import { createServerClient, getProfile } from '@/lib/supabase/server'
import { formatDate, formatPrice } from '@/lib/utils'
import type { Course, Enrollment } from '@/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Acquisti e fatture' }

export default async function AcquistiPage() {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')

  const supabase = createServerClient()
  const { data } = await supabase
    .from('enrollments')
    .select('*, course:courses(id, title, slug)')
    .eq('user_id', profile.id)
    .order('enrolled_at', { ascending: false })

  const enrollments = (data ?? []) as (Enrollment & { course: Course })[]

  return (
    <div className="py-10">
      <div className="container-wide">
        <div className="mb-10">
          <h4 className="font-bold text-white">Acquisti e fatture</h4>
          <p className="text-white/50 mt-1">Lo storico dei tuoi acquisti, con le ricevute Stripe.</p>
        </div>

        {enrollments.length === 0 ? (
          <div className="card p-12 text-center">
            <CreditCard className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/50 mb-4">Non hai ancora effettuato acquisti.</p>
            <Link href="/corsi" className="btn-primary inline-flex text-sm">Esplora i corsi</Link>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border text-left text-white/40">
                  <th className="px-5 py-3">Corso</th>
                  <th className="px-5 py-3">Data</th>
                  <th className="px-5 py-3">Importo</th>
                  <th className="px-5 py-3">Stato</th>
                  <th className="px-5 py-3 text-right">Ricevuta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {enrollments.map((e) => (
                  <tr key={e.id}>
                    <td className="px-5 py-3">
                      <Link href={`/corsi/${e.course?.slug}`} className="text-white hover:text-brand transition-colors">
                        {e.course?.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-white/50">{formatDate(e.enrolled_at)}</td>
                    <td className="px-5 py-3 text-white/70">
                      {e.amount_paid_cents > 0 ? formatPrice(e.amount_paid_cents) : 'Gratuito'}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full border border-surface-border text-white/50">
                        {e.status === 'active' ? 'Attivo' : e.status === 'expired' ? 'Scaduto' : 'Annullato'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {e.stripe_payment_intent_id ? (
                        <a
                          href={`/api/receipts/${e.stripe_payment_intent_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-white/60 hover:text-white transition-colors"
                        >
                          <Receipt className="w-4 h-4" />
                          Apri
                        </a>
                      ) : (
                        <span className="text-white/20">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-white/30 mt-6 max-w-2xl">
          Le ricevute sono generate da Stripe. I dati di fatturazione (CF, P.IVA, SDI) si impostano in{' '}
          <Link href="/dashboard/impostazioni" className="text-white/50 hover:text-white underline">Impostazioni</Link>.
        </p>
      </div>
    </div>
  )
}
