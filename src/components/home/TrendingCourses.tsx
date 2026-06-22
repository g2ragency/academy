'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import AnimatedCourseGrid from '@/components/courses/AnimatedCourseGrid'
import CourseTypeIcon from '@/components/icons/CourseTypeIcon'
import type { Course, CourseType } from '@/types'

const FILTER_TABS: { label: string; value: CourseType | 'all' }[] = [
  { label: 'In tendenza', value: 'all' },
  { label: 'Fast Focus', value: 'fast_focus' },
  { label: 'Webinar', value: 'webinar' },
  { label: 'Master', value: 'short_master' },
  { label: 'Executive Master', value: 'executive_master' },
]

const TYPE_CHIPS: { label: string; value: CourseType }[] = [
  { label: 'Webinar', value: 'webinar' },
  { label: 'Masterclass', value: 'masterclass' },
  { label: 'Fast Focus', value: 'fast_focus' },
  { label: 'Short Master', value: 'short_master' },
  { label: 'Executive Master', value: 'executive_master' },
]

interface Props {
  courses: Course[]
}

export default function TrendingCourses({ courses }: Props) {
  const [activeFilter, setActiveFilter] = useState<CourseType | 'all'>('all')

  const filtered = activeFilter === 'all' ? courses : courses.filter((c) => c.type === activeFilter)

  return (
    <section id="trending" className="bg-surface scroll-mt-16">
      <div className="section-divider" />
      <div className="container-wide py-16">
        <h3 className="text-white text-center mb-12">Di tendenza in Academy</h3>

        {/* Tab: riga scrollabile su mobile, griglia a 5 colonne a tutta
            larghezza da md in su (Figma mostra i tab anche su mobile) */}
        <div className="flex md:grid md:grid-cols-5 gap-7 md:gap-0 overflow-x-auto scrollbar-hide mb-10 -mx-5 px-5 md:mx-0 md:px-0 fade-x-right md:[mask-image:none] md:[-webkit-mask-image:none]">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveFilter(tab.value)}
              className={`shrink-0 md:shrink whitespace-nowrap pb-4 border-b-2 text-base md:text-[22px] transition-colors ${
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
        <div className="flex items-center gap-3 overflow-x-auto pb-2 mb-10 scrollbar-hide -mx-5 px-5 md:mx-0 md:px-0 fade-x-right">
          {TYPE_CHIPS.map((chip) => {
            const active = activeFilter === chip.value
            return (
              <button
                key={chip.value}
                onClick={() => setActiveFilter(active ? 'all' : chip.value)}
                className={`shrink-0 inline-flex items-center gap-2.5 h-[50px] pl-2 pr-4 rounded-[15px] text-lg transition-colors ${
                  active ? 'bg-white text-black' : 'bg-card backdrop-blur-[20px] text-muted'
                }`}
              >
                <span
                  className={`w-[35px] h-[35px] rounded-[10px] flex items-center justify-center ${
                    active ? 'bg-[#989898] text-white' : 'bg-[#888888] text-black'
                  }`}
                >
                  <CourseTypeIcon type={chip.value} className="w-[18px] h-[18px]" />
                </span>
                {chip.label}
              </button>
            )
          })}
        </div>

        {/* Griglia corsi con entrata/uscita animata al cambio filtro */}
        {filtered.length === 0 ? (
          <p className="text-center text-muted py-16">Nessun corso trovato.</p>
        ) : (
          <AnimatedCourseGrid
            courses={filtered.slice(0, 4)}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
          />
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

