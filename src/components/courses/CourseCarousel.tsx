'use client'

import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import CourseCard from './CourseCard'
import type { Course } from '@/types'

/** Carosello di CourseCard con titolo e frecce (scroll orizzontale nativo) */
export default function CourseCarousel({ title, courses }: { title: string; courses: Course[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const scroll = (dir: -1 | 1) => trackRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h5 className="text-white">{title}</h5>
        {courses.length > 1 && (
          <div className="flex gap-2">
            <button
              onClick={() => scroll(-1)}
              aria-label="Scorri indietro"
              className="w-9 h-9 rounded-full border border-surface-border text-white/60 hover:text-white hover:border-white/30 transition-colors flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll(1)}
              aria-label="Scorri avanti"
              className="w-9 h-9 rounded-full border border-surface-border text-white/60 hover:text-white hover:border-white/30 transition-colors flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      <div ref={trackRef} className="flex gap-5 overflow-x-auto scrollbar-hide pb-1">
        {courses.map((course) => (
          <div key={course.id} className="w-72 shrink-0">
            <CourseCard course={course} />
          </div>
        ))}
      </div>
    </div>
  )
}
