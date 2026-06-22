'use client'

import { AnimatePresence, motion } from 'framer-motion'
import CourseCard from './CourseCard'
import type { Course } from '@/types'

interface Props {
  courses: Course[]
  /** Classi della griglia (grid-cols, gap, ...) */
  className?: string
  /** Inoltrate a ogni CourseCard (es. mobileWide) */
  cardProps?: { mobileWide?: boolean }
}

/**
 * Griglia di CourseCard con entrata/uscita animata (Framer Motion): al cambio
 * filtro le card che escono sfumano via e quelle nuove entrano in fade.
 *
 * NB: si anima SOLO l'opacity, niente `scale`/`layout`. Un transform sul
 * wrapper (anche identità) crea un compositing layer permanente che fa
 * "lampeggiare" gli angoli a punta della card durante l'hover (il <Link>
 * interno fa translate sopra il div con overflow-hidden + border-radius).
 * Con la sola opacity il wrapper resta senza transform e l'hover è pulito.
 */
export default function AnimatedCourseGrid({ courses, className, cardProps }: Props) {
  return (
    <div className={className}>
      <AnimatePresence mode="popLayout" initial={false}>
        {courses.map((course) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <CourseCard course={course} {...cardProps} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
