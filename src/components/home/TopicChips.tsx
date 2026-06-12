import Link from 'next/link'
import { TAXONOMY_PARAM_PREFIX, buildTermTree } from '@/lib/taxonomy'
import type { Taxonomy } from '@/types'

interface Props {
  taxonomies: Taxonomy[]
}

/**
 * Chip degli argomenti generate dalle tassonomie con show_in_home:
 * ogni chip linka alla pagina corsi già filtrata.
 */
export default function TopicChips({ taxonomies }: Props) {
  const groups = taxonomies
    .map((taxonomy) => ({ taxonomy, tree: buildTermTree(taxonomy.terms ?? []) }))
    .filter((g) => g.tree.length > 0)

  if (groups.length === 0) return null

  return (
    <section className="bg-surface py-20">
      <div className="container-wide">
        {groups.map(({ taxonomy, tree }) => (
          <div key={taxonomy.id} className="mb-12 last:mb-0">
            <h3 className="text-white mb-8">{taxonomy.name}</h3>
            <div className="flex flex-wrap gap-3">
              {tree.map((term) => (
                <Link
                  key={term.id}
                  href={`/corsi?${TAXONOMY_PARAM_PREFIX}${taxonomy.slug}=${term.slug}`}
                  className="px-5 py-2.5 rounded-full border border-surface-border text-white/70 hover:text-white hover:border-white/30 hover:bg-surface-elevated transition-colors text-sm"
                >
                  {term.name}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
