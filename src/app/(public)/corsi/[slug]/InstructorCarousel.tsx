'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import InstructorCard from '@/components/instructors/InstructorCard'
import type { Instructor } from '@/types'

/** Carosello "Relatori": scroll orizzontale nativo + frecce, card foto/nome/qualifica */
export default function InstructorCarousel({ instructors }: { instructors: Instructor[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const scroll = (dir: -1 | 1) => trackRef.current?.scrollBy({ left: dir * 280, behavior: 'smooth' })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h5 className="text-white">Relatori</h5>
        {/* Frecce: solo da md in su (su mobile il carosello scorre con il dito,
            come "I nostri docenti" in homepage) */}
        {instructors.length > 1 && (
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => scroll(-1)}
              aria-label="Scorri indietro"
              className="w-9 h-9 rounded-full border border-surface-border text-white/60 hover:text-white hover:border-white/30 transition-colors flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll(1)}
              aria-label="Scorri avanti"
              className="w-9 h-9 rounded-full border border-surface-border text-white/60 hover:text-white hover:border-white/30 transition-colors flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Mobile: carosello con card a larghezza fissa 148px e sfumatura nera
          a destra (stesso pattern di "I nostri docenti" in homepage).
          Desktop: card a larghezza dinamica (3.5 in vista). */}
      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-1 -mx-5 px-5 md:mx-0 md:px-0 fade-x-right md:[mask-image:none] md:[-webkit-mask-image:none]"
      >
        {instructors.map((instructor) => (
          <div
            key={instructor.id}
            className="w-[148px] md:w-auto shrink-0 md:basis-[calc((100%-48px)/3.5)]"
          >
            <InstructorCard instructor={instructor} />
          </div>
        ))}
      </div>

      {/* CTA: bottone pieno su mobile (Figma), link "Carica di più" su desktop —
          stesso pattern di "I nostri docenti" in homepage */}
      <div className="mt-6 md:mt-8">
        <Link
          href="/docenti"
          className="md:hidden block w-full text-center bg-white text-black rounded-[10px] py-3 text-sm"
        >
          Scopri tutti i relatori
        </Link>
        <Link
          href="/docenti"
          className="hidden md:inline-flex w-full items-center justify-center gap-2 text-muted hover:text-white transition-colors"
        >
          Carica di più <ChevronDown className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
