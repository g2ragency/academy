'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  children: React.ReactNode
  /** Altezza in px del contenuto collassato (default 140) */
  collapsedHeight?: number
}

/**
 * Wrapper che mostra solo una porzione del contenuto, con sfumatura nera in
 * basso e toggle "Mostra di più / Mostra meno". Analogo a [[ExpandableText]],
 * ma accetta JSX qualsiasi (lista, paragrafi, ecc.) invece di solo testo/HTML.
 * Il toggle compare solo se il contenuto è effettivamente più alto del
 * collassato (misurato runtime).
 */
export default function Collapsible({ children, collapsedHeight = 140 }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [fullHeight, setFullHeight] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)

  // Misura l'altezza reale del contenuto: serve sia per decidere se mostrare
  // il toggle, sia come valore di destinazione per animare max-height da
  // `collapsedHeight` al valore reale. Aggiorno a ogni resize del contenuto.
  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const update = () => setFullHeight(el.scrollHeight)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const needsToggle = fullHeight > collapsedHeight + 2
  // Fade come `mask-image` sul container: il testo svanisce in trasparenza
  // (non sovrapposto a un overlay nero), così il nero del body si vede
  // attraverso senza stacchi visivi tra fade e bottone.
  const showFade = needsToggle && !expanded
  const fadeMask = 'linear-gradient(to bottom, black 35%, transparent 100%)'

  // max-height target: se non serve toggle uso `fullHeight` (sblocca il
  // contenuto); se serve, uso `collapsedHeight` o `fullHeight` a seconda
  // dello stato — entrambi valori px concreti, indispensabili per la
  // transition (CSS non sa animare `auto`).
  const targetHeight = needsToggle ? (expanded ? fullHeight : collapsedHeight) : fullHeight

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
        {children}
      </div>
      {needsToggle && (
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
