import Link from 'next/link'
import Image from 'next/image'
import { Clock, Play } from 'lucide-react'
import { CourseTypeBadge } from '@/components/ui/Badge'
import { getMediaUrl } from '@/lib/media'
import { formatHours, stripHtml } from '@/lib/utils'
import type { Course } from '@/types'

interface Props {
  course: Course
  /** Destinazione custom (default: pagina pubblica del corso) */
  href?: string
  /** Percentuale completamento: mostra la barra sulla thumbnail (dashboard) */
  progress?: number
}

/** Card corso orizzontale ("Gli altri utenti hanno seguito anche", tab Corsi
 *  dashboard).
 *  - Mobile (Figma): layout compatto, radius 10 (card + immagine), miniatura
 *    quadrata, solo badge tipo + titolo (niente "ore", niente descrizione).
 *  - Desktop: card grande con immagine 360px, badge + durata + descrizione. */
export default function CourseRowCard({ course, href, progress }: Props) {
  const thumb = getMediaUrl(course.thumbnail_url)

  return (
    <Link
      href={href ?? `/corsi/${course.slug}`}
      className="flex flex-row sm:gap-5 sm:py-4 sm:px-[18px] sm:rounded-[30px] gap-3 p-2.5 rounded-[10px] bg-card transition-colors"
    >
      {/* Miniatura: quadrata e piccola su mobile, 360×aspect-video su desktop */}
      <div className="w-20 h-20 sm:w-[360px] sm:h-auto shrink-0 sm:aspect-video rounded-[10px] sm:rounded-[20px] overflow-hidden relative bg-surface-elevated">
        {thumb ? (
          <Image src={thumb} alt={course.title} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Play className="w-8 h-8 text-white/20" />
          </div>
        )}
        {typeof progress === 'number' && (
          <div className="absolute bottom-0 inset-x-0 h-1 bg-black/50">
            <div className="h-full bg-white transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 sm:py-1 flex flex-col justify-start">
        <div className="flex items-center gap-3">
          {/* Targhetta: padding e radius ridotti su mobile (10×4 + r5 vs
              18×8 + r10 su desktop, valori Figma) */}
          <CourseTypeBadge
            type={course.type}
            className="bg-[#F4F3F3]/15 backdrop-blur-[20px] !px-2.5 !py-1 !rounded-[5px] !text-[18px] !leading-none sm:!px-[18px] sm:!py-2 sm:!rounded-[10px]"
          />
          {/* Durata: solo da sm in su (su mobile la card resta compatta) */}
          {course.duration_minutes ? (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-[18px] py-2 rounded-[10px] bg-[#F4F3F3]/15 backdrop-blur-[20px] text-[18px] leading-none text-[#989898]">
              <Clock className="w-3.5 h-3.5" />
              {formatHours(course.duration_minutes)}
            </span>
          ) : null}
        </div>
        {/* Titolo: +2px su mobile (18px). Uso `max-sm:` così l'override esiste
            solo sotto sm; da sm in su l'utility scompare e l'h6 torna alla
            scala fluida base definita in globals.css. */}
        <h6 className="text-white mt-1.5 sm:mt-2.5 line-clamp-2 sm:line-clamp-1" style={{ fontSize: '32px', lineHeight: '35px' }}>
          {course.title}
        </h6>
        {/* Descrizione: solo desktop (Figma mobile la omette) */}
        {course.short_description && (
          <p className="hidden sm:block text-muted mt-2 line-clamp-2" style={{ fontSize: '18px', lineHeight: '26px' }}>{stripHtml(course.short_description)}</p>
        )}
      </div>
    </Link>
  )
}
