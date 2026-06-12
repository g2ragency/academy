import Link from 'next/link'
import Image from 'next/image'
import { Clock, Play } from 'lucide-react'
import { getMediaUrl } from '@/lib/media'
import { formatHours } from '@/lib/utils'
import type { Course } from '@/types'

interface Props {
  course: Course
  enrolled?: boolean
  progress?: number
}

/**
 * Card corso (design Figma): thumbnail a tutta card, pannello in
 * sovraimpressione bianco al 50% (#FFFFFF80) con titolo e durata.
 * Per gli iscritti la riga durata diventa barra di avanzamento.
 */
export default function CourseCard({ course, enrolled, progress }: Props) {
  const thumb = getMediaUrl(course.thumbnail_url)

  return (
    <Link
      href={`/corsi/${course.slug}`}
      className="group relative block aspect-[343/450] rounded-3xl overflow-hidden bg-surface-card border border-surface-border transition-transform duration-300 hover:-translate-y-1"
    >
      {thumb ? (
        <Image
          src={thumb}
          alt={course.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Play className="w-12 h-12 text-white/10" />
        </div>
      )}

      {/* Pannello informazioni in sovraimpressione */}
      <div className="absolute inset-x-3 bottom-3 rounded-2xl bg-white/50 backdrop-blur-md p-6">
        <h5 className="text-black leading-snug line-clamp-2 mb-4">{course.title}</h5>
        <div className="border-t border-black/40 pt-3 flex items-center gap-1.5 text-black text-sm">
          {enrolled ? (
            <>
              <div className="flex-1 h-1.5 rounded-full bg-black/20 overflow-hidden">
                <div className="h-full bg-black transition-all" style={{ width: `${progress ?? 0}%` }} />
              </div>
              <span className="text-xs shrink-0">{progress ?? 0}%</span>
            </>
          ) : (
            <>
              <Clock className="w-3.5 h-3.5" />
              {course.duration_minutes ? formatHours(course.duration_minutes) : 'On demand'}
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
