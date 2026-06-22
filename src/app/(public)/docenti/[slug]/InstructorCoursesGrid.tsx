'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import CourseCard from '@/components/courses/CourseCard'
import type { Course } from '@/types'

const PAGE_SIZE = 4

export default function InstructorCoursesGrid({ courses }: { courses: Course[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE)
  const shown = courses.slice(0, visible)
  const hasMore = visible < courses.length

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {shown.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>

      <div className="mt-8 text-center">
        {hasMore ? (
          <button
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="inline-flex items-center gap-2 text-muted hover:text-white transition-colors"
          >
            Carica di più <ChevronDown className="w-4 h-4" />
          </button>
        ) : (
          <Link
            href="/corsi"
            className="inline-flex items-center gap-2 text-muted hover:text-white transition-colors"
          >
            Scopri tutti i corsi <ChevronDown className="w-4 h-4" />
          </Link>
        )}
      </div>
    </>
  )
}
