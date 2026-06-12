import { createServerClient } from '@/lib/supabase/server'
import { getTaxonomiesWithTerms, getFilteredCourseIds } from '@/lib/taxonomy.server'
import { buildTermTree, TAXONOMY_PARAM_PREFIX } from '@/lib/taxonomy'
import CourseCard from '@/components/courses/CourseCard'
import { COURSE_TYPE_LABELS, type CourseType, type Taxonomy, type Term } from '@/types'
import { Search } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Corsi' }

const COURSE_TYPES = Object.entries(COURSE_TYPE_LABELS) as [CourseType, string][]

interface Props {
  searchParams: Record<string, string | undefined> & { tipo?: string; livello?: string; q?: string }
}

async function getCourses(searchParams: Props['searchParams'], taxonomyCourseIds: string[] | null) {
  const supabase = createServerClient()
  let query = supabase
    .from('courses')
    .select('*, instructor:instructors!courses_instructor_id_fkey(*)')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })

  if (searchParams.tipo) query = query.eq('type', searchParams.tipo)
  if (searchParams.livello) query = query.eq('level', searchParams.livello)
  if (searchParams.q) query = query.ilike('title', `%${searchParams.q}%`)
  if (taxonomyCourseIds !== null) {
    if (taxonomyCourseIds.length === 0) return []
    query = query.in('id', taxonomyCourseIds)
  }

  const { data } = await query
  return data ?? []
}

/** Ricostruisce la querystring preservando gli altri filtri attivi */
function buildFilterHref(searchParams: Props['searchParams'], key: string, value: string | null) {
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(searchParams)) {
    if (v && k !== key) params.set(k, v)
  }
  if (value) params.set(key, value)
  const qs = params.toString()
  return `/corsi${qs ? `?${qs}` : ''}`
}

export default async function CorsiPage({ searchParams }: Props) {
  const taxonomies = await getTaxonomiesWithTerms({ showInFilters: true, appliesToCourses: true })
  const taxonomyCourseIds = await getFilteredCourseIds(taxonomies, searchParams)
  const courses = await getCourses(searchParams, taxonomyCourseIds)
  const activeTipo = searchParams.tipo

  return (
    <div className="min-h-screen bg-surface pt-24 pb-20">
      <div className="container-wide">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar filtri (sticky) */}
          <aside className="lg:w-60 shrink-0">
            <div className="sticky top-24">
              {/* Search */}
              <form method="get" className="mb-5">
                {Object.entries(searchParams).map(([k, v]) =>
                  v && k !== 'q' ? <input key={k} type="hidden" name={k} value={v} /> : null
                )}
                <div className="relative">
                  <input
                    name="q"
                    defaultValue={searchParams.q}
                    placeholder="Cerca corsi..."
                    className="input pl-9 text-sm"
                  />
                  <Search className="absolute left-3 top-3.5 w-4 h-4 text-white/30" />
                </div>
              </form>

              <div className="divide-y divide-surface-border">
                {/* Gruppo "Corsi" (tipo) */}
                <FilterGroup title="Corsi">
                  <FilterItem href={buildFilterHref(searchParams, 'tipo', null)} active={!activeTipo}>
                    Tutti i corsi
                  </FilterItem>
                  {COURSE_TYPES.map(([type, label]) => (
                    <FilterItem
                      key={type}
                      href={buildFilterHref(searchParams, 'tipo', activeTipo === type ? null : type)}
                      active={activeTipo === type}
                    >
                      {label}
                    </FilterItem>
                  ))}
                </FilterGroup>

                {/* Livello */}
                <FilterGroup title="Livello">
                  {(['base', 'intermedio', 'avanzato'] as const).map((level) => {
                    const isActive = searchParams.livello === level
                    return (
                      <FilterItem
                        key={level}
                        href={buildFilterHref(searchParams, 'livello', isActive ? null : level)}
                        active={isActive}
                        className="capitalize"
                      >
                        {level}
                      </FilterItem>
                    )
                  })}
                </FilterGroup>

                {/* Filtri dinamici dalle tassonomie create dall'admin */}
                {taxonomies.map((taxonomy) => (
                  <TaxonomyFilterGroup
                    key={taxonomy.id}
                    taxonomy={taxonomy}
                    searchParams={searchParams}
                  />
                ))}
              </div>
            </div>
          </aside>

          {/* Colonna corsi */}
          <div className="flex-1">
            <h5 className="text-white mb-8">I nostri corsi</h5>
            {courses.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-white/30 text-lg mb-2">Nessun corso trovato</p>
                <a href="/corsi" className="text-brand text-sm hover:underline">Rimuovi i filtri</a>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Gruppo della sidebar filtri: titolo + voci, separato dagli altri da un divisore */
function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-5 first:pt-0">
      <p className="text-sm text-white mb-2.5">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

/** Voce filtro: barretta verticale a sinistra quando attiva (come da design) */
function FilterItem({ href, active, className = '', children }: {
  href: string
  active: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      className={`block border-l-2 pl-2.5 py-1 text-sm transition-colors ${
        active ? 'border-white text-white' : 'border-transparent text-muted hover:text-white'
      } ${className}`}
    >
      {children}
    </a>
  )
}

/** Gruppo di filtri generato da una tassonomia creata dall'admin */
function TaxonomyFilterGroup({ taxonomy, searchParams }: {
  taxonomy: Taxonomy
  searchParams: Props['searchParams']
}) {
  const tree = buildTermTree(taxonomy.terms ?? [])
  if (tree.length === 0) return null

  const paramKey = `${TAXONOMY_PARAM_PREFIX}${taxonomy.slug}`
  const activeSlug = searchParams[paramKey]

  const renderTerm = (term: Term, depth: number) => {
    const isActive = activeSlug === term.slug
    return (
      <div key={term.id} className={depth ? 'ml-3' : ''}>
        <a
          href={buildFilterHref(searchParams, paramKey, isActive ? null : term.slug)}
          className={`block border-l-2 pl-2.5 py-1 text-sm transition-colors ${
            isActive ? 'border-white text-white' : 'border-transparent text-muted hover:text-white'
          }`}
        >
          {term.name}
        </a>
        {term.children?.map((child) => renderTerm(child, depth + 1))}
      </div>
    )
  }

  return (
    <div className="py-5 first:pt-0">
      <p className="text-sm text-white mb-2.5">{taxonomy.name}</p>
      <div className="space-y-0.5">
        {tree.map((term) => renderTerm(term, 0))}
      </div>
    </div>
  )
}
