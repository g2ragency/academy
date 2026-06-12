import { createServerClient } from '@/lib/supabase/server'
import { TAXONOMY_PARAM_PREFIX, resolveTermWithDescendants } from '@/lib/taxonomy'
import type { Taxonomy } from '@/types'

interface TaxonomyFilter {
  showInFilters?: boolean
  showInHome?: boolean
  appliesToCourses?: boolean
  appliesToInstructors?: boolean
}

export async function getTaxonomiesWithTerms(filter: TaxonomyFilter = {}): Promise<Taxonomy[]> {
  const supabase = createServerClient()
  let query = supabase
    .from('taxonomies')
    .select('*, terms(*)')
    .order('sort_order')
  if (filter.showInFilters) query = query.eq('show_in_filters', true)
  if (filter.showInHome) query = query.eq('show_in_home', true)
  if (filter.appliesToCourses) query = query.eq('applies_to_courses', true)
  if (filter.appliesToInstructors) query = query.eq('applies_to_instructors', true)
  const { data } = await query
  return (data ?? []) as Taxonomy[]
}

/** Id dei corsi associati ad ALMENO uno dei terms dati */
export async function getCourseIdsByTerms(termIds: string[]): Promise<string[]> {
  if (!termIds.length) return []
  const supabase = createServerClient()
  const { data } = await supabase
    .from('course_terms')
    .select('course_id')
    .in('term_id', termIds)
  return Array.from(new Set((data ?? []).map((r) => r.course_id as string)))
}

/**
 * Legge i filtri tassonomia attivi dai searchParams e restituisce gli id corso
 * che li soddisfano TUTTI (intersezione tra gruppi), oppure null se nessun
 * filtro tassonomia è attivo.
 */
export async function getFilteredCourseIds(
  taxonomies: Taxonomy[],
  searchParams: Record<string, string | undefined>
): Promise<string[] | null> {
  let result: Set<string> | null = null

  for (const taxonomy of taxonomies) {
    const termSlug = searchParams[`${TAXONOMY_PARAM_PREFIX}${taxonomy.slug}`]
    if (!termSlug) continue
    const termIds = resolveTermWithDescendants(taxonomy, termSlug)
    const courseIds = await getCourseIdsByTerms(termIds)
    const set = new Set(courseIds)
    if (result === null) {
      result = set
    } else {
      const prev: string[] = Array.from(result)
      result = new Set(prev.filter((id) => set.has(id)))
    }
  }

  return result === null ? null : Array.from(result)
}
