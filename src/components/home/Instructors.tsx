import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import InstructorCard from '@/components/instructors/InstructorCard'
import type { Instructor } from '@/types'

interface Props {
  instructors: Instructor[]
}

export default function Instructors({ instructors }: Props) {
  const shown = instructors.slice(0, 10)
  const placeholders = Math.max(0, 10 - shown.length)

  return (
    <section className="py-16 bg-surface">
      <div className="container-wide">
        <h2 className="text-white mb-4">I nostri docenti</h2>
        <p className="text-muted mb-8 md:mb-12 max-w-[495px]">
          L&apos;autorità formativa dedicata esclusivamente
          <br />
          al network delle Holding italiane.
        </p>

        {/* Mobile: carosello orizzontale che sfuma nel nero a destra.
            Desktop (md+): griglia statica. */}
        <div className="flex md:grid md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5 overflow-x-auto md:overflow-visible scrollbar-hide -mx-5 px-5 md:mx-0 md:px-0 fade-x-right md:[mask-image:none] md:[-webkit-mask-image:none]">
          {shown.map((instructor) => (
            <div key={instructor.id} className="w-[148px] shrink-0 md:w-auto">
              <InstructorCard instructor={instructor} />
            </div>
          ))}
          {Array.from({ length: placeholders }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="w-[148px] shrink-0 md:w-auto aspect-[148/210] md:aspect-[268/345] rounded-[10px] md:rounded-[30px] bg-card"
            />
          ))}
        </div>

        {/* CTA: bottone pieno su mobile (Figma), link "Carica di più" su desktop */}
        <div className="mt-8 md:mt-14">
          <Link
            href="/docenti"
            className="md:hidden block w-full text-center bg-white text-black rounded-[10px] py-3 text-sm"
          >
            Scopri tutti i professori
          </Link>
          <Link
            href="/docenti"
            className="hidden md:inline-flex w-full items-center justify-center gap-2 text-muted hover:text-white transition-colors"
          >
            Carica di più <ChevronDown className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
