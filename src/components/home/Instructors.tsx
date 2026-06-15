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
        <p className="text-muted mb-12 max-w-[495px]">
          L&apos;autorità formativa dedicata esclusivamente
          <br />
          al network delle Holding italiane.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
          {shown.map((instructor) => (
            <InstructorCard key={instructor.id} instructor={instructor} />
          ))}
          {Array.from({ length: placeholders }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-[268/345] rounded-[30px] bg-muted/60" />
          ))}
        </div>

        <div className="mt-14 text-center">
          <Link
            href="/docenti"
            className="inline-flex items-center gap-2 text-muted hover:text-white transition-colors"
          >
            Carica di più <ChevronDown className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
