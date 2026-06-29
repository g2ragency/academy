import { createServerClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import type { Certificate, Course, Profile } from '@/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Attestati emessi' }

export default async function AdminAttestatiPage() {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('certificates')
    .select('*, course:courses(title), profile:profiles(full_name, email)')
    .order('issued_at', { ascending: false })

  const certs = (data ?? []) as (Certificate & { course: Pick<Course, 'title'>; profile: Pick<Profile, 'full_name' | 'email'> })[]

  return (
    <div className="px-10 py-8">
      <h4 className="font-bold text-white mb-8">Attestati emessi</h4>

      {certs.length === 0 ? (
        <p className="text-white/40 text-sm">Nessun attestato emesso finora.</p>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border text-left text-white/40">
                <th className="px-5 py-3">Numero</th>
                <th className="px-5 py-3">Utente</th>
                <th className="px-5 py-3">Corso</th>
                <th className="px-5 py-3">Data emissione</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {certs.map((cert) => (
                <tr key={cert.id}>
                  <td className="px-5 py-3 text-white/70">{cert.certificate_number}</td>
                  <td className="px-5 py-3">
                    <p className="text-white">{cert.profile?.full_name}</p>
                    <p className="text-xs text-white/40">{cert.profile?.email}</p>
                  </td>
                  <td className="px-5 py-3 text-white/70">{cert.course?.title}</td>
                  <td className="px-5 py-3 text-white/50">{formatDate(cert.issued_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
