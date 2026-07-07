'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Props {
  filename: string
  headers: string[]
  rows: (string | number)[][]
}

/** Cella CSV: quota solo se contiene virgola/virgolette/newline/punto e virgola. */
function csvCell(v: string | number): string {
  const s = String(v ?? '')
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Bottone che genera e scarica un CSV lato client (nessuna route server).
 *  BOM iniziale → Excel apre correttamente gli accenti. */
export default function ExportCsvButton({ filename, headers, rows }: Props) {
  const download = () => {
    const BOM = String.fromCharCode(0xfeff)
    const csv = BOM + [headers, ...rows].map((r) => r.map(csvCell).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button onClick={download} variant="secondary" size="sm" className="gap-2" disabled={rows.length === 0}>
      <Download className="w-4 h-4" />
      Esporta CSV
    </Button>
  )
}
