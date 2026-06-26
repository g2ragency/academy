import { createServerClient } from '@/lib/supabase/server'
import type { CourseFormat } from '@/types'

/** Tipologie formative (course_formats) ordinate, lettura pubblica. */
export async function getCourseFormats(): Promise<CourseFormat[]> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('course_formats')
    .select('*')
    .order('sort_order')
  return (data ?? []) as CourseFormat[]
}
