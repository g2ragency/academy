'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, GraduationCap, Presentation, ShieldCheck, Zap, Briefcase } from 'lucide-react'
import CourseCard from '@/components/courses/CourseCard'
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

interface Props {
  courses: Course[]
}

export default function TrendingCourses({ courses }: Props) {
  const [activeFilter, setActiveFilter] = useState<CourseType | 'all'>('all')

  const filtered = activeFilter === 'all' ? courses : courses.filter((c) => c.type === activeFilter)

  return (
    <section id="trending" className="py-16 bg-surface border-t border-surface-border scroll-mt-16">
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

        {/* Chip filtro per tipologia (valori Figma: radius 15, gap 12, padding 10/8) */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 mb-10 scrollbar-hide">
          {TYPE_CHIPS.map((chip) => {
            const Icon = chip.icon
            const active = activeFilter === chip.value
            return (
              <button
                key={chip.value}
                onClick={() => setActiveFilter(active ? 'all' : chip.value)}
                className={`shrink-0 inline-flex items-center gap-2.5 px-2 py-2.5 rounded-[15px] transition-colors ${
                  active ? 'bg-[#F4F3F3] text-black' : 'bg-[#1B1B1B] backdrop-blur-[20px] text-muted'
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-[10px] flex items-center justify-center text-white ${
                    active ? 'bg-[#989898]' : 'bg-[#888888]'
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

