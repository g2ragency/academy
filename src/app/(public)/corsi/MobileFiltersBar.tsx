'use client'

import { useEffect, useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'

interface TipoOption {
  value: string | null
  label: string
}

interface Props {
  /** Voci del carosello tipi corso: "Tutti" (value null) + i 5 tipi */
  tipoOptions: TipoOption[]
  activeTipo?: string
  onSelectTipo: (value: string | null) => void
  /** Pannello filtri esteso (search + livello + tassonomie) per il drawer */
  children: React.ReactNode
  /** Pallino sul bottone filtri quando ci sono filtri extra attivi */
  hasActiveExtra?: boolean
}

/**
 * Barra filtri mobile della pagina /corsi:
 * - carosello orizzontale dei tipi corso (Tutti, Webinar, ...) — filtra al
 *   volo via callback, niente navigazione
 * - bottone "filtri" che apre un drawer fullscreen con gli altri filtri
 * Nascosta su desktop (lì c'è la sidebar sticky).
 */
export default function MobileFiltersBar({
  tipoOptions,
  activeTipo,
  onSelectTipo,
  children,
  hasActiveExtra,
}: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  return (
    <>
      <div className="md:hidden flex items-center gap-2 mb-6">
        {/* Carosello tipi: fade nero esteso a destra per non far intravedere
            il chip sotto il bottone filtri */}
        <div
          className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5 flex-1 min-w-0"
          style={{
            WebkitMaskImage: 'linear-gradient(to right, #000 calc(100% - 130px), transparent 100%)',
            maskImage: 'linear-gradient(to right, #000 calc(100% - 130px), transparent 100%)',
          }}
        >
          {tipoOptions.map((opt) => {
            const active = (opt.value ?? undefined) === activeTipo
            return (
              <button
                key={opt.label}
                onClick={() => onSelectTipo(opt.value)}
                className={`shrink-0 h-10 px-5 rounded-[10px] text-sm inline-flex items-center transition-colors ${
                  active ? 'bg-white text-black' : 'bg-card text-muted hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Apri filtri"
          className="relative shrink-0 w-10 h-10 rounded-[10px] bg-card text-white inline-flex items-center justify-center"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {hasActiveExtra && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-white" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 z-50 bg-surface flex flex-col">
          <div className="flex items-center justify-between px-5 h-16 border-b border-surface-border">
            <h5 className="text-white">Filtri</h5>
            <button
              onClick={() => setOpen(false)}
              aria-label="Chiudi filtri"
              className="w-10 h-10 inline-flex items-center justify-center text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-6">{children}</div>
          <div className="px-5 pb-6 pt-3 border-t border-surface-border">
            <button
              onClick={() => setOpen(false)}
              className="w-full bg-white text-black rounded-[10px] py-3 text-sm"
            >
              Applica
            </button>
          </div>
        </div>
      )}
    </>
  )
}
