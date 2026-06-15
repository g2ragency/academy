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
 * Card corso (design Figma): card radius 40, immagine a tutta card, pannello
 * info #858585 pieno (no blur) — 14px laterale / 12px sotto, radius 30,
 * padding 16/26. Ora/icona/divisore neri al 50%.
 *
 * Il sollevamento in hover (translate) sta sul <Link> esterno e il clip
 * arrotondato sul <div> interno: tenerli separati evita il flash degli
 * angoli a punta che Chrome produce quando anima un transform sullo stesso
 * elemento che fa overflow-hidden + border-radius.
 */
export default function CourseCard({ course, enrolled, progress }: Props) {
  const thumb = getMediaUrl(course.thumbnail_url)

  return (
    <Link
      href={`/corsi/${course.slug}`}
      className="group block transition-transform duration-300 hover:-translate-y-1"
    >
      <div className="relative aspect-[343/450] rounded-[40px] overflow-hidden bg-surface-card border border-surface-border">
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
        <div className="absolute left-[14px] right-[14px] bottom-3 rounded-[30px] bg-[#858585] py-4 px-[26px]">
          <h5 className="text-black leading-snug line-clamp-2 mb-4">{course.title}</h5>
          <div className="border-t border-black/50 pt-3 flex items-center gap-1.5 text-black/50 text-sm">
            {enrolled ? (
              <>
                <div className="flex-1 h-1.5 rounded-full bg-black/20 overflow-hidden">
                  <div className="h-full bg-black/50 transition-all" style={{ width: `${progress ?? 0}%` }} />
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
      </div>
    </Link>
  )
}
