import Link from 'next/link'
import Image from 'next/image'
import { Clock, Play, User } from 'lucide-react'
import { CourseTypeBadge } from '@/components/ui/Badge'
import type { Course } from '@/types'
import { formatPrice, formatDuration } from '@/lib/utils'

interface Props {
  course: Course
  enrolled?: boolean
  progress?: number
}

export default function CourseCard({ course, enrolled, progress }: Props) {
  return (
    <Link href={`/corsi/${course.slug}`} className="card group hover:border-white/10 transition-all duration-300 hover:-translate-y-1 flex flex-col">
      {/* Thumbnail */}
      <div className="aspect-video bg-surface-elevated relative overflow-hidden shrink-0">
        {course.thumbnail_url ? (
          <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Play className="w-12 h-12 text-white/10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-2 left-2">
          <CourseTypeBadge type={course.type} />
        </div>
        {enrolled && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-border">
            <div className="h-full bg-brand transition-all" style={{ width: `${progress ?? 0}%` }} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-white leading-snug mb-2 line-clamp-2 group-hover:text-brand transition-colors flex-1">
          {course.title}
        </h3>

        <div className="flex items-center gap-2 text-xs text-white/40 mb-3">
          {course.instructor && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {course.instructor.full_name}
            </span>
          )}
          {course.duration_minutes && (
            <span className="flex items-center gap-1 ml-auto">
              <Clock className="w-3 h-3" />
              {formatDuration(course.duration_minutes)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          {enrolled ? (
            <span className="text-xs text-brand font-medium">{progress ?? 0}% completato</span>
          ) : (
            <span className="text-sm font-semibold text-brand">{formatPrice(course.price_cents)}</span>
          )}
          {course.level && (
            <span className="text-xs text-white/30 capitalize">{course.level}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
