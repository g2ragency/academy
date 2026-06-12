import { createServerClient } from '@/lib/supabase/server'
import TaxonomyManager from './TaxonomyManager'
import type { Taxonomy } from '@/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Tassonomie' }

export default async function AdminTassonomiePage() {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('taxonomies')
    .select('*, terms(*)')
    .order('sort_order')

  return (
    <div className="px-10 py-8">
      <div className="mb-8">
        <h1 className="font-bold text-white">Tassonomie</h1>
        <p className="text-sm text-white/40 mt-2 max-w-2xl">
          Crea gruppi di classificazione (es. &ldquo;Argomenti&rdquo;, &ldquo;Ruoli&rdquo;) con categorie, sottocategorie e tag.
          Tutto ciò che crei qui appare automaticamente nei filtri della pagina Corsi e, se attivato, in homepage.
        </p>
      </div>
      <TaxonomyManager initialTaxonomies={(data ?? []) as Taxonomy[]} />
    </div>
  )
}
