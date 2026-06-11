'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronDown, Clock, GraduationCap, Presentation, ShieldCheck, Zap, Briefcase } from 'lucide-react'
import type { Course, CourseType } from '@/types'

const FILTER_TABS: { label: string; value: CourseType | 'all' }[] = [
  { label: 'In tendenza', value: 'all' },
  { label: 'Fast Focus', value: 'fast_focus' },
  { label: 'Webinar', value: 'webinar' },
  { label: 'Master', value: 'short_master' },
  { label: 'Executive Master', value: 'executive_master' },
]

const TYPE_CHIPS: { label: string; value: CourseType; icon: React.ElementType }[] = [
  { label: 'Webinar', value: 'webinar', icon: Presentation },
  { label: 'Masterclass', value: 'masterclass', icon: GraduationCap },
  { label: 'Fast Focus', value: 'fast_focus', icon: Zap },
  { label: 'Short Master', value: 'short_master', icon: Briefcase },
  { label: 'Executive Master', value: 'executive_master', icon: ShieldCheck },
]

function formatOre(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  return `${Math.round(minutes / 60)} ore`
}

interface Props {
  courses: Course[]
}

export default function TrendingCourses({ courses }: Props) {
  const [activeFilter, setActiveFilter] = useState<CourseType | 'all'>('all')

  const filtered = activeFilter === 'all' ? courses : courses.filter((c) => c.type === activeFilter)

  return (
    <section className="py-16 bg-surface border-t border-surface-border">
      <div className="container-wide">
        <h3 className="text-white text-center mb-12">Di tendenza in Academy</h3>

        {/* Tab a tutta larghezza con riga sotto l'etichetta */}
        <div className="hidden md:grid grid-cols-5 mb-10">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveFilter(tab.value)}
              className={`pb-4 border-b-2 transition-colors ${
                activeFilter === tab.value
                  ? 'text-white border-white'
                  : 'text-muted border-surface-border hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Chip filtro per tipologia */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 mb-10 scrollbar-hide">
          {TYPE_CHIPS.map((chip) => {
            const Icon = chip.icon
            const active = activeFilter === chip.value
            return (
              <button
                key={chip.value}
                onClick={() => setActiveFilter(active ? 'all' : chip.value)}
                className={`shrink-0 flex items-center gap-3 pl-2 pr-5 h-[50px] rounded-xl transition-colors ${
                  active ? 'bg-white text-black' : 'bg-surface-card text-white hover:bg-surface-elevated'
                }`}
              >
                <span
                  className={`w-[35px] h-[35px] rounded-lg flex items-center justify-center ${
                    active ? 'bg-black/80 text-white' : 'bg-surface-elevated text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </span>
                {chip.label}
              </button>
            )
          })}
        </div>

        {/* Griglia corsi */}
        {filtered.length === 0 ? (
          <p className="text-center text-muted py-16">Nessun corso trovato.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.slice(0, 4).map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
          <Link
            href="/corsi"
            className="inline-flex items-center gap-2 text-muted hover:text-white transition-colors"
          >
            Carica di più <ChevronDown className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      href={`/corsi/${course.slug}`}
      className="group relative aspect-[343/450] rounded-3xl overflow-hidden bg-surface-card"
    >
      {course.thumbnail_url && (
        <Image
          src={course.thumbnail_url}
          alt={course.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
      )}

      {/* Pannello informazioni in sovraimpressione */}
      <div className="absolute inset-x-3 bottom-3 rounded-2xl bg-muted p-6">
        <h5 className="text-black leading-snug line-clamp-2 mb-4">{course.title}</h5>
        <div className="border-t border-black/40 pt-3 flex items-center gap-1.5 text-black text-sm">
          <Clock className="w-3.5 h-3.5" />
          {course.duration_minutes ? formatOre(course.duration_minutes) : 'On demand'}
        </div>
      </div>
    </Link>
  )
}
