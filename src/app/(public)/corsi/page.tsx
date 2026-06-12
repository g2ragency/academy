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
    .select('*, instructor:instructors(*)')
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
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-bold text-white mb-3">Tutti i corsi</h1>
          <p className="text-white/50">
            {courses.length} corso{courses.length !== 1 ? 'i' : ''} disponibil{courses.length !== 1 ? 'i' : 'e'}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filters */}
          <aside className="lg:w-56 shrink-0">
            <div className="sticky top-24 space-y-6">
              {/* Search */}
              <form method="get">
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

              {/* Type filter */}
              <div>
                <h3 className="font-semibold text-white/40 uppercase tracking-widest mb-3">Tipo</h3>
                <div className="space-y-1">
                  <a href={buildFilterHref(searchParams, 'tipo', null)} className={`block px-3 py-2 rounded-lg text-sm transition-colors ${!activeTipo ? 'bg-brand/15 text-white font-medium' : 'text-white/60 hover:text-white hover:bg-surface-elevated'}`}>
                    Tutti
                  </a>
                  {COURSE_TYPES.map(([type, label]) => (
                    <a
                      key={type}
                      href={buildFilterHref(searchParams, 'tipo', type)}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${activeTipo === type ? 'bg-brand/15 text-white font-medium' : 'text-white/60 hover:text-white hover:bg-surface-elevated'}`}
                    >
                      {label}
                    </a>
                  ))}
                </div>
              </div>

              {/* Level filter */}
              <div>
                <h3 className="font-semibold text-white/40 uppercase tracking-widest mb-3">Livello</h3>
                <div className="space-y-1">
                  {(['base', 'intermedio', 'avanzato'] as const).map((level) => {
                    const isActive = searchParams.livello === level
                    return (
                      <a
                        key={level}
                        href={buildFilterHref(searchParams, 'livello', isActive ? null : level)}
                        className={`block px-3 py-2 rounded-lg text-sm capitalize transition-colors ${isActive ? 'bg-brand/15 text-white font-medium' : 'text-white/60 hover:text-white hover:bg-surface-elevated'}`}
                      >
                        {level}
                      </a>
                    )
                  })}
                </div>
              </div>

              {/* Filtri dinamici dalle tassonomie create dall'admin */}
              {taxonomies.map((taxonomy) => (
                <TaxonomyFilterGroup
                  key={taxonomy.id}
                  taxonomy={taxonomy}
                  searchParams={searchParams}
                />
              ))}
            </div>
          </aside>

          {/* Course grid */}
          <div className="flex-1">
            {courses.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-white/30 text-lg mb-2">Nessun corso trovato</p>
                <a href="/corsi" className="text-brand text-sm hover:underline">Rimuovi i filtri</a>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
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
      <div key={term.id}>
        <a
          href={buildFilterHref(searchParams, paramKey, isActive ? null : term.slug)}
          className={`block px-3 py-2 rounded-lg text-sm transition-colors ${depth ? 'ml-3' : ''} ${
            isActive ? 'bg-brand/15 text-white font-medium' : 'text-white/60 hover:text-white hover:bg-surface-elevated'
          }`}
        >
          {term.name}
        </a>
        {term.children?.map((child) => renderTerm(child, depth + 1))}
      </div>
    )
  }

  return (
    <div>
      <h3 className="font-semibold text-white/40 uppercase tracking-widest mb-3">{taxonomy.name}</h3>
      <div className="space-y-1">
        {tree.map((term) => renderTerm(term, 0))}
      </div>
    </div>
  )
}
