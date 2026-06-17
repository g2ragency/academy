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

/** Rileva se la stringa contiene HTML (output del rich editor) */
function isHtml(s: string) { return /<[a-z][\s\S]*>/i.test(s) }

/** Testo/HTML lungo con clamp + fade verso il nero e toggle "Mostra di più" */
export default function ExpandableText({ text, collapsedHeight = 260, threshold = 500 }: Props) {
  const [expanded, setExpanded] = useState(false)
  const plainLength = isHtml(text) ? text.replace(/<[^>]*>/g, '').length : text.length
  const isLong = plainLength > threshold

  return (
    <div>
      <div
        className="relative overflow-hidden"
        style={{ maxHeight: expanded || !isLong ? undefined : collapsedHeight }}
      >
        {isHtml(text) ? (
          <div
            className="rich-content text-white/60 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: text }}
          />
        ) : (
          <div className="text-white/60 leading-relaxed whitespace-pre-line">{text}</div>
        )}
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
