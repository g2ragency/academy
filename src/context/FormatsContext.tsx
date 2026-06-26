'use client'

import { createContext, useContext, useMemo } from 'react'
import type { CourseFormat } from '@/types'

/**
 * Tipologie formative disponibili (course_formats), caricate UNA volta lato
 * server nel root layout e passate qui: badge/chip/filtri/navbar le leggono
 * con un hook, senza prop-drilling né join sulle query corsi (course.type è
 * già lo slug). Disponibili anche in SSR (initial dal server).
 */
const FormatsContext = createContext<CourseFormat[]>([])

export function FormatsProvider({ formats, children }: { formats: CourseFormat[]; children: React.ReactNode }) {
  return <FormatsContext.Provider value={formats}>{children}</FormatsContext.Provider>
}

/** Lista completa dei formati (ordinata per sort_order). */
export function useFormats(): CourseFormat[] {
  return useContext(FormatsContext)
}

/** Il formato di uno slug, o undefined se sconosciuto. */
export function useFormat(slug: string): CourseFormat | undefined {
  const formats = useContext(FormatsContext)
  return useMemo(() => formats.find((f) => f.slug === slug), [formats, slug])
}
