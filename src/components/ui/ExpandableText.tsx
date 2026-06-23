'use client'

import { useEffect, useRef, useState } from 'react'
import DownArrowIcon from '@/components/icons/DownArrowIcon'

interface Props {
  text: string
  /** Altezza in px del testo collassato */
  collapsedHeight?: number
  /** Sotto questa lunghezza il toggle non serve */
  threshold?: number
  /** Classi Tailwind applicate al div testo interno (sovrascrivono il default) */
  textClassName?: string
}

function isHtml(s: string) { return /<[a-z][\s\S]*>/i.test(s) }

export default function ExpandableText({ text, collapsedHeight = 260, threshold = 500, textClassName = 'text-white/60 leading-relaxed' }: Props) {
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
            className={`rich-content ${textClassName}`}
            dangerouslySetInnerHTML={{ __html: text }}
          />
        ) : (
          <div className={`whitespace-pre-line ${textClassName}`}>{text}</div>
        )}
      </div>
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 flex items-center gap-2 text-[14px] sm:text-[24px] leading-[32px] text-white hover:text-white/70 transition-colors"
        >
          {expanded ? 'Mostra meno' : 'Mostra di più'}
          <DownArrowIcon className={`shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </button>
      )}
    </div>
  )
}
