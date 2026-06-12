import type { Taxonomy, Term } from '@/types'

// Helper puri, importabili sia da server che da client component.
// I fetcher server-side stanno in taxonomy.server.ts.

/** Prefisso dei parametri URL dei filtri tassonomia: ?t_{taxonomySlug}={termSlug} */
export const TAXONOMY_PARAM_PREFIX = 't_'

/** Trasforma la lista piatta dei terms in albero (categoria -> sottocategorie), ordinato per sort_order */
export function buildTermTree(terms: Term[]): Term[] {
  const byId = new Map<string, Term>(terms.map((t) => [t.id, { ...t, children: [] }]))
  const roots: Term[] = []
  byId.forEach((t) => {
    if (t.parent_id && byId.has(t.parent_id)) byId.get(t.parent_id)!.children!.push(t)
    else roots.push(t)
  })
  const sortRec = (list: Term[]) => {
    list.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
    list.forEach((t) => t.children?.length && sortRec(t.children!))
  }
  sortRec(roots)
  return roots
}

/** Risolve uno slug term nella lista [term, ...discendenti] (id) dentro una taxonomy già caricata */
export function resolveTermWithDescendants(taxonomy: Taxonomy, termSlug: string): string[] {
  const terms = taxonomy.terms ?? []
  const root = terms.find((t) => t.slug === termSlug)
  if (!root) return []
  const ids = [root.id]
  // gerarchia a 2 livelli, ma gestiamo N livelli per sicurezza
  let frontier = [root.id]
  while (frontier.length) {
    const children = terms.filter((t) => t.parent_id && frontier.includes(t.parent_id)).map((t) => t.id)
    ids.push(...children)
    frontier = children
  }
  return ids
}
