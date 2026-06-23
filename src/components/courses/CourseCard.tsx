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
  /** Su mobile usa aspect-ratio "wide" 353/236 + radius 15 (variante elenco
   *  pagina /corsi). Default = card verticale 343/450 (home/trending). */
  mobileWide?: boolean
}

/**
 * Card corso (design Figma): card radius 40 desktop, immagine a tutta card,
 * pannello info bianco 50% + blur, padding 16/26.
 *
 * Il sollevamento in hover (translate) sta sul <Link> esterno e il clip
 * arrotondato sul <div> interno: tenerli separati evita il flash degli
 * angoli a punta che Chrome produce quando anima un transform sullo stesso
 * elemento che fa overflow-hidden + border-radius.
 */
export default function CourseCard({ course, enrolled, progress, mobileWide }: Props) {
  const thumb = getMediaUrl(course.thumbnail_url)
  // Mobile: due varianti — verticale "home" (343/450 r10) o "wide" elenco
  // corsi (353/236 r15). Su desktop sempre verticale 343/450 r40.
  const aspectAndRadius = mobileWide
    ? 'aspect-[353/236] rounded-[15px] md:aspect-[343/450] md:rounded-[40px]'
    : 'aspect-[343/450] rounded-[10px] md:rounded-[40px]'

  return (
    <Link
      href={`/corsi/${course.slug}`}
      className="group block transition-transform duration-300 hover:-translate-y-1"
    >
      <div className={`relative overflow-hidden bg-card border border-surface-border ${aspectAndRadius}`}>
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

        {/* Pannello informazioni in sovraimpressione (Figma: vetro bianco 50% + blur) */}
        <div className="absolute left-2.5 right-2.5 bottom-2 md:left-[14px] md:right-[14px] md:bottom-3 rounded-[10px] md:rounded-[30px] bg-white/50 backdrop-blur-[7.5px] p-3 md:py-4 md:px-[26px]">
          <h5 className="text-black leading-[22px] md:leading-[35px] line-clamp-2 mb-2 md:mb-4">{course.title}</h5>
          <div className="border-t border-black/40 pt-2 md:pt-3 flex items-center gap-1 md:gap-1.5 text-black/60 text-[clamp(0.625rem,0.514rem+0.451vw,0.875rem)] leading-none">
            {enrolled ? (
              <>
                <div className="flex-1 h-1.5 rounded-full bg-black/20 overflow-hidden">
                  <div className="h-full bg-black/50 transition-all" style={{ width: `${progress ?? 0}%` }} />
                </div>
                <span className="shrink-0">{progress ?? 0}%</span>
              </>
            ) : (
              <>
                <Clock className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
                {course.duration_minutes ? formatHours(course.duration_minutes) : 'On demand'}
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
