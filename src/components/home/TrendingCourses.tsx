'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import AnimatedCourseGrid from '@/components/courses/AnimatedCourseGrid'
import FormatIcon from '@/components/icons/FormatIcon'
import { useFormats } from '@/context/FormatsContext'
import type { Course } from '@/types'

interface Props {
  courses: Course[]
}

export default function TrendingCourses({ courses }: Props) {
  const formats = useFormats()
  const [activeFilter, setActiveFilter] = useState<string>('all')

  const filterTabs = [{ label: 'In tendenza', value: 'all' }, ...formats.map((f) => ({ label: f.name, value: f.slug }))]

  const filtered = activeFilter === 'all' ? courses : courses.filter((c) => c.type === activeFilter)

  return (
    <section id="trending" className="bg-surface scroll-mt-16">
      <div className="section-divider" />
      <div className="container-wide py-16">
        <h3 className="text-white md:text-center mb-12">Di tendenza in Academy</h3>

        {/* Tab: riga scrollabile su mobile, griglia a 5 colonne a tutta
            larghezza da md in su (Figma mostra i tab anche su mobile) */}
        <div className="flex md:flex-wrap md:justify-center gap-0 md:gap-x-8 overflow-x-auto scrollbar-hide mb-10 -mx-5 px-5 md:mx-0 md:px-0 fade-x-right md:[mask-image:none] md:[-webkit-mask-image:none]">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveFilter(tab.value)}
              className={`shrink-0 md:shrink whitespace-nowrap pb-4 px-[14px] first:pl-0 last:pr-0 md:px-0 border-b-2 md:border-b-[4px] text-base md:text-[22px] leading-none transition-colors ${
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
          {formats.map((f) => {
            const active = activeFilter === f.slug
            return (
              <button
                key={f.slug}
                onClick={() => setActiveFilter(active ? 'all' : f.slug)}
                className={`shrink-0 inline-flex items-center gap-2.5 h-[50px] pl-[11px] pr-[14px] rounded-[10px] md:rounded-[15px] text-sm md:text-lg leading-none transition-colors ${
                  active ? 'bg-white text-black' : 'bg-card backdrop-blur-[20px] text-white'
                }`}
              >
                <span
                  className={`w-[35px] h-[35px] rounded-[10px] flex items-center justify-center ${
                    active ? 'bg-[#989898] text-white' : 'bg-[#888888] text-black'
                  }`}
                >
                  <FormatIcon slug={f.slug} iconUrl={f.icon_url} className="w-[18px] h-[18px]" />
                </span>
                {f.name}
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

