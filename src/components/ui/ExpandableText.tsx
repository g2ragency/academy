'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  text: string
  /** Altezza in px del testo collassato */
  collapsedHeight?: number
  /** Sotto questa lunghezza il toggle non serve */
  threshold?: number
}

function isHtml(s: string) { return /<[a-z][\s\S]*>/i.test(s) }

export default function ExpandableText({ text, collapsedHeight = 260, threshold = 500 }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [fullHeight, setFullHeight] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)

  const plainLength = isHtml(text) ? text.replace(/<[^>]*>/g, '').length : text.length
  const isLong = plainLength > threshold

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const update = () => setFullHeight(el.scrollHeight)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [text])

  const showFade = isLong && !expanded
  const fadeMask = 'linear-gradient(to bottom, black 35%, transparent 100%)'
  const targetHeight = isLong ? (expanded ? fullHeight : collapsedHeight) : fullHeight

  return (
    <div>
      <div
        ref={contentRef}
        className="overflow-hidden transition-[max-height] duration-300 ease-out motion-reduce:transition-none"
        style={{
          maxHeight: fullHeight === 0 ? undefined : targetHeight,
          WebkitMaskImage: showFade ? fadeMask : undefined,
          maskImage: showFade ? fadeMask : undefined,
        }}
      >
        {isHtml(text) ? (
          <div
            className="rich-content text-white/60 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: text }}
          />
        ) : (
          <div className="text-white/60 leading-relaxed whitespace-pre-line">{text}</div>
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
