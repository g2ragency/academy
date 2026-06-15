'use client'

import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
        {instructors.length > 1 && (
          <div className="flex gap-2">
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

      <div className="relative">
        <div ref={trackRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
          {instructors.map((instructor) => (
            // 3 card e mezzo in vista: la basis lascia mezza card visibile a destra
            <div key={instructor.id} className="shrink-0 basis-[calc((100%-48px)/3.5)]">
              <InstructorCard instructor={instructor} />
            </div>
          ))}
        </div>
        {/* La mezza card a destra si sfoca, per suggerire lo scroll */}
        {instructors.length > 3 && (
          <div
            className="absolute right-0 top-0 bottom-1 w-[16%] pointer-events-none"
            style={{
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              maskImage: 'linear-gradient(to right, transparent, #000 70%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, #000 70%)',
            }}
          />
        )}
      </div>
    </div>
  )
}
