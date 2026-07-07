'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import ExportCsvButton from '@/components/admin/ExportCsvButton'

export interface ProgressRow {
  userName: string
  email: string
  courseTitle: string
  completedLessons: number
  totalLessons: number
  progress: number
}

/** Vista admin "Andamento corsi": una riga per (utente × corso) con % di
 *  avanzamento. Ricerca lato client (utente/email/corso) + export CSV. */
export default function AndamentoTable({ rows }: { rows: ProgressRow[] }) {
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase()
    if (!n) return rows
    return rows.filter((r) => `${r.userName} ${r.email} ${r.courseTitle}`.toLowerCase().includes(n))
  }, [rows, q])

  const csvRows = filtered.map((r) => [
    r.userName,
    r.email,
    r.courseTitle,
    `${r.completedLessons}/${r.totalLessons}`,
    `${r.progress}%`,
  ])

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-4 mb-6">
        <div className="flex items-baseline gap-3">
          <h4 className="font-bold text-white">Andamento corsi</h4>
          <span className="text-sm text-white/40">{filtered.length} righe</span>
        </div>
        <ExportCsvButton
          filename="andamento-corsi.csv"
          headers={['Utente', 'Email', 'Corso', 'Lezioni', 'Avanzamento']}
          rows={csvRows}
        />
      </div>

      <div className="flex items-center gap-3 bg-surface border-[0.5px] border-muted rounded-[10px] px-4 h-12 mb-5 max-w-md">
        <Search className="w-4 h-4 text-muted shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cerca utente, email o corso…"
          className="flex-1 min-w-0 bg-transparent text-[16px] text-white placeholder:text-muted focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-white/40 text-[16px]">Nessun dato di avanzamento.</p>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-[16px]">
            <thead>
              <tr className="border-b border-surface-border text-left text-[13px] text-white/40 uppercase tracking-wide">
                <th className="px-5 py-3">Utente</th>
                <th className="px-5 py-3">Corso</th>
                <th className="px-5 py-3 w-32">Lezioni</th>
                <th className="px-5 py-3 w-56">Avanzamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filtered.map((r, i) => (
                <tr key={`${r.email}-${r.courseTitle}-${i}`}>
                  <td className="px-5 py-3">
                    <p className="text-white">{r.userName}</p>
                    <p className="text-[14px] text-muted">{r.email}</p>
                  </td>
                  <td className="px-5 py-3 text-white/70">{r.courseTitle}</td>
                  <td className="px-5 py-3 text-white/50 tabular-nums">{r.completedLessons}/{r.totalLessons}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 rounded-full bg-surface-border overflow-hidden">
                        <div className="h-full bg-white rounded-full" style={{ width: `${r.progress}%` }} />
                      </div>
                      <span className="text-white tabular-nums w-10 text-right">{r.progress}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
