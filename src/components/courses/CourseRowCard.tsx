import Link from 'next/link'
import Image from 'next/image'
import { Clock, Play } from 'lucide-react'
import { CourseTypeBadge } from '@/components/ui/Badge'
import { getMediaUrl } from '@/lib/media'
import { formatDuration } from '@/lib/utils'
import type { Course } from '@/types'

/** Card corso orizzontale (sezione "Gli altri utenti hanno seguito anche") */
export default function CourseRowCard({ course }: { course: Course }) {
  const thumb = getMediaUrl(course.thumbnail_url)

  return (
    <Link
      href={`/corsi/${course.slug}`}
      className="card flex flex-col sm:flex-row gap-5 p-4 hover:border-white/10 transition-colors"
    >
      <div className="sm:w-56 shrink-0 aspect-video rounded-lg overflow-hidden relative bg-surface-elevated">
        {thumb ? (
          <Image src={thumb} alt={course.title} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Play className="w-8 h-8 text-white/20" />
          </div>
        )}
      </div>
      <div className="min-w-0 py-1">
        <div className="flex items-center gap-3">
          <CourseTypeBadge type={course.type} />
          {course.duration_minutes ? (
            <span className="flex items-center gap-1 text-xs text-muted">
              <Clock className="w-3.5 h-3.5" />
              {formatDuration(course.duration_minutes)}
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
