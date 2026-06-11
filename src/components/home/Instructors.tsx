import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight, Linkedin, User } from 'lucide-react'
import type { Instructor } from '@/types'

interface Props {
  instructors: Instructor[]
}

export default function Instructors({ instructors }: Props) {
  return (
    <section className="py-20 bg-surface">
      <div className="container-wide">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-white">I nostri docenti</h2>
            <p className="text-white/50 mt-2">L&apos;autorità formativa dedicata al network delle Holding italiane.</p>
          </div>
          <Link href="/docenti" className="hidden sm:flex items-center gap-1 text-sm text-brand hover:text-brand-light transition-colors">
            Cerca di più <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {instructors.slice(0, 5).map((instructor) => (
            <InstructorCard key={instructor.id} instructor={instructor} />
          ))}
          {/* Empty placeholder cards */}
          {Array.from({ length: Math.max(0, 5 - instructors.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="card aspect-[3/4] bg-surface-elevated/50" />
          ))}
        </div>

        {/* Second row */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {instructors.slice(5, 10).map((instructor) => (
            <InstructorCard key={instructor.id} instructor={instructor} />
          ))}
          {Array.from({ length: Math.max(0, 5 - Math.max(0, instructors.length - 5)) }).map((_, i) => (
            <div key={`empty2-${i}`} className="card aspect-[3/4] bg-surface-elevated/50" />
          ))}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link href="/docenti" className="text-sm text-brand hover:text-brand-light transition-colors flex items-center justify-center gap-1">
            Cerca di più <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

function InstructorCard({ instructor }: { instructor: Instructor }) {
  return (
    <Link href={`/docenti/${instructor.slug}`} className="card group overflow-hidden hover:border-white/10 transition-all duration-300">
      <div className="aspect-[3/4] relative overflow-hidden bg-surface-elevated">
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <p className="font-semibold text-white text-sm leading-tight">{instructor.full_name}</p>
          {instructor.title && (
            <p className="text-xs text-white/60 mt-0.5 line-clamp-2">{instructor.title}</p>
          )}
        </div>
        {instructor.linkedin_url && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <a
              href={instructor.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 bg-black/60 rounded-lg backdrop-blur-sm"
            >
              <Linkedin className="w-3.5 h-3.5 text-white/80" />
            </a>
          </div>
        )}
      </div>
    </Link>
  )
}
