'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  text: string
  /** Altezza in px del testo collassato */
  collapsedHeight?: number
  /** Sotto questa lunghezza il toggle non serve */
  threshold?: number
}

/** Testo lungo con clamp + fade verso il nero e toggle "Mostra di più" */
export default function ExpandableText({ text, collapsedHeight = 260, threshold = 500 }: Props) {
  const [expanded, setExpanded] = useState(false)
  const isLong = text.length > threshold

  return (
    <div>
      <div
        className="relative overflow-hidden"
        style={{ maxHeight: expanded || !isLong ? undefined : collapsedHeight }}
      >
        <div className="text-white/60 leading-relaxed whitespace-pre-line">{text}</div>
        {isLong && !expanded && (
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-surface to-transparent pointer-events-none" />
        )}
      </div>
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 flex items-center gap-1.5 text-sm text-white hover:text-white/70 transition-colors"
        >
          {expanded ? 'Mostra meno' : 'Mostra di più'}
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      )}
    </div>
  )
}
