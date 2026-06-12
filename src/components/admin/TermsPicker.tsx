'use client'

import { buildTermTree } from '@/lib/taxonomy'
import type { Taxonomy, Term } from '@/types'

interface Props {
  /** Taxonomies con terms caricati (già filtrate per applies_to_*) */
  taxonomies: Taxonomy[]
  /** Id dei terms selezionati */
  value: string[]
  onChange: (termIds: string[]) => void
}

/**
 * Checkbox-tree dei terms raggruppati per tassonomia, riusato nei form
 * corso e docente per associare le classificazioni.
 */
export default function TermsPicker({ taxonomies, value, onChange }: Props) {
  const toggle = (termId: string) => {
    onChange(value.includes(termId) ? value.filter((id) => id !== termId) : [...value, termId])
  }

  const visible = taxonomies.filter((t) => (t.terms ?? []).length > 0)
  if (visible.length === 0) {
    return (
      <p className="text-sm text-white/30">
        Nessuna classificazione disponibile: creala in <span className="text-white/50">Admin → Tassonomie</span>.
      </p>
    )
  }

  return (
    <div className="space-y-5">
      {visible.map((taxonomy) => (
        <div key={taxonomy.id}>
          <h4 className="text-sm text-white/40 uppercase tracking-widest mb-2">{taxonomy.name}</h4>
          <div className="space-y-1">
            {buildTermTree(taxonomy.terms ?? []).map((root) => (
              <TermCheckbox key={root.id} term={root} value={value} onToggle={toggle} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function TermCheckbox({ term, value, onToggle, depth = 0 }: {
  term: Term
  value: string[]
  onToggle: (id: string) => void
  depth?: number
}) {
  return (
    <>
      <label className={`flex items-center gap-2.5 py-1 cursor-pointer ${depth ? 'ml-6' : ''}`}>
        <input
          type="checkbox"
          checked={value.includes(term.id)}
          onChange={() => onToggle(term.id)}
          className="w-4 h-4 accent-brand rounded shrink-0"
        />
        <span className="text-sm text-white/70">{term.name}</span>
      </label>
      {term.children?.map((child) => (
        <TermCheckbox key={child.id} term={child} value={value} onToggle={onToggle} depth={depth + 1} />
      ))}
    </>
  )
}
