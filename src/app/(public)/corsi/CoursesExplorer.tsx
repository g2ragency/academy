'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import AnimatedCourseGrid from '@/components/courses/AnimatedCourseGrid'
import MobileFiltersBar from './MobileFiltersBar'
import { buildTermTree, resolveTermWithDescendants, TAXONOMY_PARAM_PREFIX } from '@/lib/taxonomy'
import { COURSE_TYPE_LABELS, type Course, type CourseType, type Taxonomy, type Term } from '@/types'

const COURSE_TYPES = Object.entries(COURSE_TYPE_LABELS) as [CourseType, string][]
const LEVELS = ['base', 'intermedio', 'avanzato'] as const

/** Corso con gli id dei term associati (per filtrare le tassonomie in memoria) */
export type CourseWithTerms = Course & { termIds: string[] }

interface Props {
  courses: CourseWithTerms[]
  taxonomies: Taxonomy[]
  /** Valori iniziali dei filtri letti dai searchParams (deep link) */
  initial: Record<string, string | undefined>
}

/**
 * Esplora corsi con filtraggio DINAMICO lato client: niente reload di pagina,
 * le card entrano/escono con animazione (vedi [[AnimatedCourseGrid]]).
 * Il server passa TUTTI i corsi pubblicati una volta sola; qui si filtra in
 * memoria. L'URL viene aggiornato con `history.replaceState` (link condivisibili
 * senza navigazione).
 */
export default function CoursesExplorer({ courses, taxonomies, initial }: Props) {
  const [tipo, setTipo] = useState<string | undefined>(initial.tipo)
  const [livello, setLivello] = useState<string | undefined>(initial.livello)
  const [q, setQ] = useState(initial.q ?? '')
  const [terms, setTerms] = useState<Record<string, string | undefined>>(() => {
    const t: Record<string, string | undefined> = {}
    for (const tax of taxonomies) {
      const v = initial[`${TAXONOMY_PARAM_PREFIX}${tax.slug}`]
      if (v) t[tax.slug] = v
    }
    return t
  })

  // Lista filtrata in memoria (istantanea, nessuna richiesta al server)
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return courses.filter((c) => {
      if (tipo && c.type !== tipo) return false
      if (livello && c.level !== livello) return false
      if (needle && !c.title.toLowerCase().includes(needle)) return false
      for (const [taxSlug, termSlug] of Object.entries(terms)) {
        if (!termSlug) continue
        const tax = taxonomies.find((t) => t.slug === taxSlug)
        if (!tax) continue
        const ids = resolveTermWithDescendants(tax, termSlug)
        if (!c.termIds.some((id) => ids.includes(id))) return false
      }
      return true
    })
  }, [courses, tipo, livello, q, terms, taxonomies])

  // Sincronizza l'URL (shareable) senza far ripartire la pagina
  useEffect(() => {
    const params = new URLSearchParams()
    if (tipo) params.set('tipo', tipo)
    if (livello) params.set('livello', livello)
    if (q.trim()) params.set('q', q.trim())
    for (const [taxSlug, termSlug] of Object.entries(terms)) {
      if (termSlug) params.set(`${TAXONOMY_PARAM_PREFIX}${taxSlug}`, termSlug)
    }
    const qs = params.toString()
    window.history.replaceState(null, '', `/corsi${qs ? `?${qs}` : ''}`)
  }, [tipo, livello, q, terms])

  const setTerm = (taxSlug: string, termSlug: string | null) =>
    setTerms((prev) => ({ ...prev, [taxSlug]: termSlug ?? undefined }))

  const hasActiveExtra =
    !!livello || !!q.trim() || Object.values(terms).some(Boolean)

  const tipoOptions = [
    { value: null, label: 'Tutti' },
    ...COURSE_TYPES.map(([value, label]) => ({ value: value as string, label })),
  ]

  // Controlli "estesi" (search + livello + tassonomie), condivisi tra sidebar
  // desktop e drawer mobile
  const extendedFilters = (
    <>
      <div className="flex items-center gap-3 bg-surface backdrop-blur-[20px] border-[0.5px] border-white rounded-[10px] px-4 h-12 mb-5">
        <Search className="w-4 h-4 text-muted shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cerca corsi..."
          className="flex-1 min-w-0 bg-transparent text-sm text-white placeholder:text-muted focus:outline-none"
        />
      </div>
      <div className="divide-y divide-muted">
        <FilterGroup title="Livello">
          {LEVELS.map((level) => (
            <FilterItem
              key={level}
              active={livello === level}
              onClick={() => setLivello(livello === level ? undefined : level)}
              className="capitalize"
            >
              {level}
            </FilterItem>
          ))}
        </FilterGroup>

        {taxonomies.map((taxonomy) => {
          const tree = buildTermTree(taxonomy.terms ?? [])
          if (tree.length === 0) return null
          const active = terms[taxonomy.slug]
          const renderTerm = (term: Term, depth: number): React.ReactNode => (
            <div key={term.id} className={depth ? 'ml-3' : ''}>
              <FilterItem
                active={active === term.slug}
                onClick={() => setTerm(taxonomy.slug, active === term.slug ? null : term.slug)}
              >
                {term.name}
              </FilterItem>
              {term.children?.map((child) => renderTerm(child, depth + 1))}
            </div>
          )
          return (
            <FilterGroup key={taxonomy.id} title={taxonomy.name}>
              {tree.map((term) => renderTerm(term, 0))}
            </FilterGroup>
          )
        })}
      </div>
    </>
  )

  return (
    <div className="flex flex-col lg:flex-row gap-10">
      {/* Sidebar filtri (sticky) — desktop only */}
      <aside className="hidden lg:block lg:w-60 shrink-0">
        <div className="sticky top-24">
          <div className="flex items-center gap-3 bg-surface backdrop-blur-[20px] border-[0.5px] border-white rounded-[10px] px-4 h-12 mb-5">
            <Search className="w-4 h-4 text-muted shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cerca corsi..."
              className="flex-1 min-w-0 bg-transparent text-sm text-white placeholder:text-muted focus:outline-none"
            />
          </div>
          <div className="divide-y divide-muted">
            <FilterGroup title="Corsi">
              <FilterItem active={!tipo} onClick={() => setTipo(undefined)}>
                Tutti i corsi
              </FilterItem>
              {COURSE_TYPES.map(([type, label]) => (
                <FilterItem
                  key={type}
                  active={tipo === type}
                  onClick={() => setTipo(tipo === type ? undefined : type)}
                >
                  {label}
                </FilterItem>
              ))}
            </FilterGroup>

            <FilterGroup title="Livello">
              {LEVELS.map((level) => (
                <FilterItem
                  key={level}
                  active={livello === level}
                  onClick={() => setLivello(livello === level ? undefined : level)}
                  className="capitalize"
                >
                  {level}
                </FilterItem>
              ))}
            </FilterGroup>

            {taxonomies.map((taxonomy) => {
              const tree = buildTermTree(taxonomy.terms ?? [])
              if (tree.length === 0) return null
              const active = terms[taxonomy.slug]
              const renderTerm = (term: Term, depth: number): React.ReactNode => (
                <div key={term.id} className={depth ? 'ml-3' : ''}>
                  <FilterItem
                    active={active === term.slug}
                    onClick={() => setTerm(taxonomy.slug, active === term.slug ? null : term.slug)}
                  >
                    {term.name}
                  </FilterItem>
                  {term.children?.map((child) => renderTerm(child, depth + 1))}
                </div>
              )
              return (
                <FilterGroup key={taxonomy.id} title={taxonomy.name}>
                  {tree.map((term) => renderTerm(term, 0))}
                </FilterGroup>
              )
            })}
          </div>
        </div>
      </aside>

      {/* Colonna corsi */}
      <div className="flex-1 min-w-0">
        {/* Titolo: 32px desktop, nascosto su mobile (Figma) */}
        <h5 className="hidden md:block text-white leading-none mb-6 md:mb-8" style={{ fontSize: '32px' }}>I nostri corsi</h5>

        <MobileFiltersBar
          tipoOptions={tipoOptions}
          activeTipo={tipo}
          onSelectTipo={(v) => setTipo(v ?? undefined)}
          hasActiveExtra={hasActiveExtra}
        >
          {extendedFilters}
        </MobileFiltersBar>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/30 text-lg mb-2">Nessun corso trovato</p>
            <button
              onClick={() => { setTipo(undefined); setLivello(undefined); setQ(''); setTerms({}) }}
              className="text-brand text-sm hover:underline"
            >
              Rimuovi i filtri
            </button>
          </div>
        ) : (
          <AnimatedCourseGrid
            courses={filtered}
            cardProps={{ mobileWide: true }}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-[15px] sm:gap-6"
          />
        )}
      </div>
    </div>
  )
}

/** Gruppo della sidebar filtri: titolo + voci */
function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-5 first:pt-0">
      <p className="text-sm text-white mb-2.5">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

/** Voce filtro: lineetta verticale #D7C8FF (2px, alta quanto il testo) quando attiva */
function FilterItem({ active, onClick, className = '', children }: {
  active: boolean
  onClick: () => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 w-full text-left py-1 text-[18px] leading-[1.5] transition-colors ${
        active ? 'text-white' : 'text-muted hover:text-white'
      }`}
    >
      <span className={`w-0.5 h-[18px] shrink-0 ${active ? 'bg-[#D7C8FF]' : 'bg-transparent'}`} />
      <span className={className}>{children}</span>
    </button>
  )
}
