'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getMediaUrl } from '@/lib/media'
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

      <div ref={trackRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
        {instructors.map((instructor) => {
          const avatar = getMediaUrl(instructor.avatar_url)
          return (
            <Link key={instructor.id} href={`/docenti/${instructor.slug}`} className="w-52 shrink-0 group">
              <div className="aspect-[3/4] rounded-2xl overflow-hidden relative bg-surface-elevated border border-surface-border">
                {avatar ? (
                  <Image
                    src={avatar}
                    alt={instructor.full_name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white/30 text-4xl">
                    {instructor.full_name[0]}
                  </div>
                )}
              </div>
              <p className="text-base text-white mt-3">{instructor.full_name}</p>
              {instructor.title && <p className="text-xs text-muted mt-1 line-clamp-2">{instructor.title}</p>}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
