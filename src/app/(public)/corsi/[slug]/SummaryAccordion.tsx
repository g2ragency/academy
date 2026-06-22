'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  label: string
  children: React.ReactNode
}

/**
 * Accordion del "Riepilogo del corso" su mobile: apertura/chiusura animata
 * con il trick grid-template-rows `0fr → 1fr` (stesso pattern di FAQItem in
 * homepage), che permette di animare l'altezza senza dover misurare il
 * contenuto. La chevron ruota di 180° in sincrono.
 */
export default function SummaryAccordion({ label, children }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-[15px] bg-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 h-[53px] text-left"
      >
        <span className="text-muted">{label}</span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted shrink-0 transition-transform duration-300',
            open && 'rotate-180'
          )}
        />
      </button>
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-5 pt-1">{children}</div>
        </div>
      </div>
    </div>
  )
}
