import Link from 'next/link'
import Image from 'next/image'
import { Clock, Play } from 'lucide-react'
import { CourseTypeBadge } from '@/components/ui/Badge'
import { getMediaUrl } from '@/lib/media'
import { formatHours } from '@/lib/utils'
import type { Course } from '@/types'

interface Props {
  course: Course
  /** Destinazione custom (default: pagina pubblica del corso) */
  href?: string
  /** Percentuale completamento: mostra la barra sulla thumbnail (dashboard) */
  progress?: number
}

/** Card corso orizzontale ("Gli altri utenti hanno seguito anche", tab Corsi dashboard) */
export default function CourseRowCard({ course, href, progress }: Props) {
  const thumb = getMediaUrl(course.thumbnail_url)

  return (
    <Link
      href={href ?? `/corsi/${course.slug}`}
      className="flex flex-col sm:flex-row gap-5 py-4 px-[18px] rounded-[30px] bg-[#1B1B1B] transition-colors"
    >
      <div className="sm:w-56 shrink-0 aspect-video rounded-[20px] overflow-hidden relative bg-surface-elevated">
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
      <div className="min-w-0 py-1">
        <div className="flex items-center gap-3">
          <CourseTypeBadge type={course.type} className="bg-[#F4F3F3]/15 backdrop-blur-[20px]" />
          {course.duration_minutes ? (
            <span className="inline-flex items-center gap-1.5 px-[18px] py-2 rounded-[10px] bg-[#F4F3F3]/15 backdrop-blur-[20px] text-xs text-[#989898]">
              <Clock className="w-3.5 h-3.5" />
              {formatHours(course.duration_minutes)}
            </span>
          ) : null}
        </div>
        <h6 className="text-white mt-2.5 line-clamp-1">{course.title}</h6>
        {course.short_description && (
          <p className="text-sm text-muted mt-2 line-clamp-2">{course.short_description}</p>
        )}
      </div>
    </Link>
  )
}
