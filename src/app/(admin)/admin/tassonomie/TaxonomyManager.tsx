'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus, Edit2, X, Save, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { slugify } from '@/lib/utils'
import TermsTree from './TermsTree'
import type { Taxonomy } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Nome obbligatorio'),
  slug: z.string().min(2, 'Slug obbligatorio').regex(/^[a-z0-9-]+$/, 'Solo lettere minuscole, numeri e trattini'),
  description: z.string().optional(),
  applies_to_courses: z.boolean(),
  applies_to_instructors: z.boolean(),
  show_in_filters: z.boolean(),
  show_in_home: z.boolean(),
  sort_order: z.coerce.number().min(0),
})
type FormData = z.infer<typeof schema>

export default function TaxonomyManager({ initialTaxonomies }: { initialTaxonomies: Taxonomy[] }) {
  const [taxonomies, setTaxonomies] = useState(initialTaxonomies)
  const [editing, setEditing] = useState<Taxonomy | null | 'new'>(null)
  const supabase = createClient()
  const router = useRouter()

  const deleteTaxonomy = async (taxonomy: Taxonomy) => {
    if (!confirm(`Eliminare "${taxonomy.name}" con tutte le sue voci? I corsi perderanno le associazioni.`)) return
    const { error } = await supabase.from('taxonomies').delete().eq('id', taxonomy.id)
    if (error) { toast.error(error.message); return }
    setTaxonomies((prev) => prev.filter((t) => t.id !== taxonomy.id))
    toast.success('Gruppo eliminato')
    router.refresh()
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {taxonomies.map((taxonomy) => (
        <div key={taxonomy.id} className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 bg-surface-elevated">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-white">{taxonomy.name}</span>
              <span className="text-xs text-white/30">/{taxonomy.slug}</span>
              {taxonomy.show_in_filters && <FlagBadge label="Filtri corsi" />}
              {taxonomy.show_in_home && <FlagBadge label="Homepage" />}
              {taxonomy.applies_to_instructors && <FlagBadge label="Docenti" />}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setEditing(taxonomy)} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-surface-card transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => deleteTaxonomy(taxonomy)} className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-surface-card transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-5">
            <TermsTree taxonomyId={taxonomy.id} initialTerms={taxonomy.terms ?? []} />
          </div>
        </div>
      ))}

      <button onClick={() => setEditing('new')} className="btn-primary text-sm gap-2 inline-flex items-center">
        <Plus className="w-4 h-4" /> Nuovo gruppo
      </button>

      {editing && (
        <TaxonomyFormModal
          taxonomy={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={(saved, isNew) => {
            setTaxonomies((prev) => isNew
              ? [...prev, { ...saved, terms: [] }]
              : prev.map((t) => (t.id === saved.id ? { ...saved, terms: t.terms } : t)))
            setEditing(null)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

function FlagBadge({ label }: { label: string }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full border border-surface-border text-white/50">
      {label}
    </span>
  )
}

function TaxonomyFormModal({ taxonomy, onClose, onSaved }: {
  taxonomy?: Taxonomy
  onClose: () => void
  onSaved: (saved: Taxonomy, isNew: boolean) => void
}) {
  const supabase = createClient()
  const isEditing = !!taxonomy

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: taxonomy ? {
      name: taxonomy.name,
      slug: taxonomy.slug,
      description: taxonomy.description ?? '',
      applies_to_courses: taxonomy.applies_to_courses,
      applies_to_instructors: taxonomy.applies_to_instructors,
      show_in_filters: taxonomy.show_in_filters,
      show_in_home: taxonomy.show_in_home,
      sort_order: taxonomy.sort_order,
    } : {
      applies_to_courses: true,
      applies_to_instructors: false,
      show_in_filters: true,
      show_in_home: false,
      sort_order: 0,
    },
  })

  const onSubmit = async (data: FormData) => {
    const payload = { ...data, description: data.description || null }
    if (isEditing) {
      const { data: updated, error } = await supabase.from('taxonomies').update(payload).eq('id', taxonomy.id).select().single()
      if (error) { toast.error(error.message); return }
      toast.success('Gruppo aggiornato')
      onSaved(updated as Taxonomy, false)
    } else {
      const { data: created, error } = await supabase.from('taxonomies').insert(payload).select().single()
      if (error) { toast.error(error.message); return }
      toast.success('Gruppo creato')
      onSaved(created as Taxonomy, true)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface/50 backdrop-blur-[10px] border border-surface-border rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-white">{isEditing ? 'Modifica gruppo' : 'Nuovo gruppo'}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input {...register('name')} id="tax-name" label="Nome" placeholder="Argomenti" error={errors.name?.message}
            onChange={(e) => { register('name').onChange(e); if (!isEditing) setValue('slug', slugify(e.target.value)) }} />
          <Input {...register('slug')} id="tax-slug" label="Slug URL" placeholder="argomenti" error={errors.slug?.message} />
          <div>
            <label className="label">Descrizione (opzionale)</label>
            <textarea {...register('description')} rows={2} className="input resize-none text-sm" />
          </div>
          <Input {...register('sort_order')} id="tax-ord" type="number" label="Ordine (0 = primo)" />

          <div className="space-y-2.5 pt-1">
            {([
              ['applies_to_courses', 'Associabile ai corsi'],
              ['applies_to_instructors', 'Associabile ai docenti'],
              ['show_in_filters', 'Mostra nei filtri della pagina Corsi'],
              ['show_in_home', 'Mostra come chip in homepage'],
            ] as const).map(([field, label]) => (
              <label key={field} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" {...register(field)} className="w-4 h-4 accent-brand rounded" />
                <span className="text-sm text-white/70">{label}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={isSubmitting} size="sm" className="gap-1.5">
              <Save className="w-3.5 h-3.5" /> {isEditing ? 'Salva' : 'Crea'}
            </Button>
            <Button onClick={onClose} type="button" variant="ghost" size="sm">Annulla</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
