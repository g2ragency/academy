import { createServerClient } from '@/lib/supabase/server'
import { User, Shield } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Gestione Utenti' }

export default async function AdminUtentiPage() {
  const supabase = createServerClient()

  const { data: users } = await supabase
    .from('profiles')
    .select('*, enrollments:enrollments(count)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-8">Gestione Utenti</h1>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide">Utente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide">Azienda</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide">Ruolo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide">Iscrizioni</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide">Registrato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {(users ?? []).map((user: any) => (
                <tr key={user.id} className="hover:bg-surface-elevated transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center text-brand font-semibold text-xs shrink-0">
                        {user.full_name?.[0]?.toUpperCase() ?? user.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{user.full_name ?? '—'}</p>
                        <p className="text-xs text-white/40">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-white/60">{user.company ?? '—'}</td>
                  <td className="px-4 py-3">
                    {user.role === 'admin' ? (
                      <span className="badge bg-brand/20 text-brand border-brand/30 text-xs gap-1">
                        <Shield className="w-3 h-3" /> Admin
                      </span>
                    ) : (
                      <span className="badge bg-surface-elevated text-white/40 border-surface-border text-xs">
                        Utente
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-white/60">
                    {user.enrollments?.[0]?.count ?? 0} corsi
                  </td>
                  <td className="px-4 py-3 text-sm text-white/40">
                    {new Date(user.created_at).toLocaleDateString('it-IT')}
                  </td>
                </tr>
              ))}
              {!(users?.length) && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-white/30 text-sm">Nessun utente registrato</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
