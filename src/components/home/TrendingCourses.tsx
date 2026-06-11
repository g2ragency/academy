'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Clock, ChevronRight, Play } from 'lucide-react'
import { CourseTypeBadge } from '@/components/ui/Badge'
import type { Course, CourseType } from '@/types'
import { formatPrice, formatDuration } from '@/lib/utils'

const FILTER_TABS: { label: string; value: CourseType | 'all' }[] = [
  { label: 'In tendenza', value: 'all' },
  { label: 'Fast Focus', value: 'fast_focus' },
  { label: 'Webinar', value: 'webinar' },
  { label: 'Masterclass', value: 'masterclass' },
  { label: 'Short Master', value: 'short_master' },
  { label: 'Executive Master', value: 'executive_master' },
]

interface Props {
  courses: Course[]
}

export default function TrendingCourses({ courses }: Props) {
  const [activeTab, setActiveTab] = useState<CourseType | 'all'>('all')

  const filtered = activeTab === 'all' ? courses : courses.filter((c) => c.type === activeTab)

  return (
    <section className="py-20 bg-surface">
      <div className="container-wide">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-bold text-white">Di tendenza in Academy</h2>
          <Link href="/corsi" className="text-sm text-brand hover:text-brand-light transition-colors flex items-center gap-1">
            Carica di più <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-8 scrollbar-hide">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.value
                  ? 'bg-white text-black'
                  : 'text-white/60 hover:text-white hover:bg-surface-elevated border border-surface-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Course grid */}
        {filtered.length === 0 ? (
          <p className="text-center text-white/40 py-16">Nessun corso trovato.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filtered.slice(0, 8).map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function CourseCard({ course }: { course: Course }) {
  return (
    <Link href={`/corsi/${course.slug}`} className="card group hover:border-white/10 transition-all duration-300 hover:-translate-y-1">
      {/* Thumbnail */}
      <div className="aspect-video bg-surface-elevated relative overflow-hidden">
        {course.thumbnail_url ? (
          <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-surface-elevated to-surface-card">
            <Play className="w-10 h-10 text-white/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-2 left-2">
          <CourseTypeBadge type={course.type} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-white leading-snug mb-2 line-clamp-2 group-hover:text-brand transition-colors">
          {course.title}
        </h3>

        {course.instructor && (
          <p className="text-xs text-white/50 mb-3">{course.instructor.full_name}</p>
        )}

        <div className="flex items-center justify-between">
          {course.duration_minutes && (
            <div className="flex items-center gap-1 text-xs text-white/40">
              <Clock className="w-3 h-3" />
              {formatDuration(course.duration_minutes)}
            </div>
          )}
          <span className="text-sm font-semibold text-brand ml-auto">
            {formatPrice(course.price_cents)}
          </span>
        </div>
      </div>
    </Link>
  )
}
