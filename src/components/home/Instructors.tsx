import Link from 'next/link'
import Image from 'next/image'
import { ChevronDown, User } from 'lucide-react'
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
            <div key={`empty-${i}`} className="aspect-[268/345] rounded-3xl bg-muted/60" />
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

function InstructorCard({ instructor }: { instructor: Instructor }) {
  return (
    <Link
      href={`/docenti/${instructor.slug}`}
      className="group relative aspect-[268/345] rounded-3xl overflow-hidden bg-surface-card"
    >
      {instructor.avatar_url ? (
        <Image
          src={instructor.avatar_url}
          alt={instructor.full_name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <User className="w-16 h-16 text-white/10" />
        </div>
      )}

      {/* Pannello nome in sovraimpressione */}
      <div className="absolute inset-x-2.5 bottom-2.5 rounded-2xl bg-muted/80 backdrop-blur-sm p-4">
        <p className="text-black text-base leading-tight">{instructor.full_name}</p>
        {instructor.title && (
          <p className="text-black/70 text-xs mt-1 line-clamp-3">{instructor.title}</p>
        )}
      </div>
    </Link>
  )
}
