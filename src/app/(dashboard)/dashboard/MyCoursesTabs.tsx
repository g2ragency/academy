'use client'

import { useState } from 'react'
import Link from 'next/link'
import CourseRowCard from '@/components/courses/CourseRowCard'
import type { Course } from '@/types'

export interface EnrolledItem {
  course: Course
  progress: number
}

interface Props {
  enrolled: EnrolledItem[]
  /** Corsi suggeriti non acquistati (tab "Adatti a te") */
  recommended: Course[]
  /** Query di ricerca attiva (dalla search in sidebar), per il messaggio vuoto */
  query?: string
}

const TABS = ['Acquistati', 'Completati', 'Da vedere', 'Adatti a te'] as const
type Tab = (typeof TABS)[number]

const EMPTY_MESSAGES: Record<Tab, string> = {
  'Acquistati': 'Non sei ancora iscritto a nessun corso.',
  'Completati': 'Non hai ancora completato nessun corso.',
  'Da vedere': 'Nessun corso da vedere: hai completato tutto!',
  'Adatti a te': 'Nessun suggerimento al momento.',
}

/** Tab "Corsi" dell'area riservata (design Figma): Acquistati / Completati / Da vedere / Adatti a te */
export default function MyCoursesTabs({ enrolled, recommended, query }: Props) {
  const [active, setActive] = useState<Tab>('Acquistati')

  const lists: Record<Tab, { course: Course; progress?: number; href?: string }[]> = {
    'Acquistati': enrolled.map((e) => ({ ...e, href: `/dashboard/corsi/${e.course.slug}` })),
    'Completati': enrolled
      .filter((e) => e.progress === 100)
      .map((e) => ({ ...e, href: `/dashboard/corsi/${e.course.slug}` })),
    'Da vedere': enrolled
      .filter((e) => e.progress < 100)
      .map((e) => ({ ...e, href: `/dashboard/corsi/${e.course.slug}` })),
    // I suggeriti portano alla pagina pubblica (acquisto)
    'Adatti a te': recommended.map((course) => ({ course })),
  }

  const items = lists[active]

  return (
    <div>
      {/* Tab bar full-width con riga sotto l'etichetta */}
      <div className="grid grid-cols-2 sm:grid-cols-4 mb-8">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`pb-4 text-sm border-b-2 transition-colors ${
              active === tab
                ? 'text-white border-white'
                : 'text-muted border-surface-border hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-white/40 mb-4">
            {query ? `Nessun corso trovato per “${query}”.` : EMPTY_MESSAGES[active]}
          </p>
          <Link href="/corsi" className="btn-primary inline-flex text-sm">
            Esplora i corsi
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(({ course, progress, href }) => (
            <CourseRowCard key={course.id} course={course} href={href} progress={progress} />
          ))}
        </div>
      )}
    </div>
  )
}
