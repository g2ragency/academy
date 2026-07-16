'use client'

import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import ExportCsvButton from '@/components/admin/ExportCsvButton'

export interface TracciatoRow {
  user_id: string
  nominativo: string | null
  codicecorso: string | null
  codicefiscale: string | null
  data: string | null
  ore: number
  minuti: number
  superamentotest: string
  materia: string | null
  totalecreditipermateria: number | null
  giornata: string | null
  maturato: boolean
  motivo: string | null
}

interface Corso {
  id: string
  title: string
  fpc_course_code: string | null
  fpc_credits: number | null
}

/** Intestazioni ESATTE del modello dell'Ordine: non rinominarle. */
const COLONNE = [
  'codicecorso', 'codicefiscale', 'data', 'ore', 'minuti',
  'superamentotest', 'materia', 'totalecreditipermateria', 'giornata',
]

/** Il modello ufficiale è .xls; esportiamo CSV con le stesse intestazioni
 *  (Excel lo apre nativamente e si incolla nel modello). Se il portale
 *  dell'Ordine pretende il file .xls originale servirà una libreria. */
export default function TracciatoTable({ corsi, corsoAttivo, rows }: {
  corsi: Corso[]
  corsoAttivo?: string
  rows: TracciatoRow[]
}) {
  const router = useRouter()
  const corso = corsi.find((c) => c.id === corsoAttivo)
  const maturati = rows.filter((r) => r.maturato)

  // Nel tracciato va SOLO chi ha maturato i crediti; gli altri restano a
  // schermo con il motivo, così si capisce cosa manca.
  const csvRows = maturati.map((r) => [
    r.codicecorso ?? '', r.codicefiscale ?? '', r.data ?? '', r.ore, r.minuti,
    r.superamentotest, r.materia ?? '', r.totalecreditipermateria ?? '', r.giornata ?? '',
  ])

  if (corsi.length === 0) {
    return (
      <>
        <h4 className="font-bold text-white mb-3">Accreditamenti</h4>
        <p className="text-white/40 text-[16px]">
          Nessun corso accreditato. Attiva l&apos;accreditamento CNDCEC nella scheda di un corso
          (sezione &quot;Accreditamento (crediti FPC)&quot;).
        </p>
      </>
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-4 mb-6">
        <div className="flex items-baseline gap-3">
          <h4 className="font-bold text-white">Accreditamenti</h4>
          <span className="text-sm text-white/40">
            {maturati.length} su {rows.length} hanno maturato i crediti
          </span>
        </div>
        <ExportCsvButton
          filename={`tracciato-${corso?.fpc_course_code ?? 'corso'}.csv`}
          headers={COLONNE}
          rows={csvRows}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select
          value={corsoAttivo}
          onChange={(e) => router.push(`/admin/accreditamenti?corso=${e.target.value}`)}
          className="input max-w-md text-sm"
        >
          {corsi.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title} — {c.fpc_course_code} ({c.fpc_credits} crediti)
            </option>
          ))}
        </select>
      </div>

      {rows.length === 0 ? (
        <p className="text-white/40 text-[16px]">Nessun iscritto a questo corso.</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-[16px] whitespace-nowrap">
            <thead>
              <tr className="border-b border-surface-border text-left text-[13px] text-white/40 uppercase tracking-wide">
                <th className="px-5 py-3">Partecipante</th>
                <th className="px-5 py-3">Codice fiscale</th>
                <th className="px-5 py-3">Data</th>
                <th className="px-5 py-3">Ore effettive</th>
                <th className="px-5 py-3">Test</th>
                <th className="px-5 py-3">Crediti</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {rows.map((r) => (
                <tr key={r.user_id} className={r.maturato ? '' : 'opacity-50'}>
                  <td className="px-5 py-3">
                    <p className="text-white flex items-center gap-2">
                      {r.maturato && <CheckCircle2 className="w-4 h-4 fill-white text-black shrink-0" />}
                      {r.nominativo ?? '—'}
                    </p>
                    {r.motivo && <p className="text-[14px] text-muted">{r.motivo}</p>}
                  </td>
                  <td className="px-5 py-3 text-white/70 tabular-nums">{r.codicefiscale ?? '—'}</td>
                  <td className="px-5 py-3 text-white/50 tabular-nums">{r.data ?? '—'}</td>
                  <td className="px-5 py-3 text-white/70 tabular-nums">
                    {String(r.ore).padStart(2, '0')}:{String(r.minuti).padStart(2, '0')}
                  </td>
                  <td className="px-5 py-3 text-white/50">{r.superamentotest}</td>
                  <td className="px-5 py-3 text-white/70 tabular-nums">
                    {r.maturato ? r.totalecreditipermateria : '—'}
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
