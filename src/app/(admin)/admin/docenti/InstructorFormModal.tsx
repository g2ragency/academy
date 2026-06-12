'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus, Edit2, X, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import FileUpload from '@/components/admin/FileUpload'
import TermsPicker from '@/components/admin/TermsPicker'
import { slugify } from '@/lib/utils'
import type { Instructor, Taxonomy } from '@/types'

const schema = z.object({
  full_name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  title: z.string().optional(),
  bio: z.string().optional(),
  linkedin_url: z.string().url('URL non valido').optional().or(z.literal('')),
  sort_order: z.coerce.number().min(0),
})
type FormData = z.infer<typeof schema>

interface Props {
  instructor?: Instructor
  /** Trigger ridotto a link testuale, per l'uso inline nel form corso */
  compact?: boolean
  onCreated?: (instructor: Instructor) => void
  /** Taxonomies associabili ai docenti: se assenti, il picker non viene mostrato */
  taxonomies?: Taxonomy[]
  initialTermIds?: string[]
}

export default function InstructorFormModal({ instructor, compact, onCreated, taxonomies, initialTermIds }: Props) {
  const [open, setOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(instructor?.avatar_url ?? null)
  const [termIds, setTermIds] = useState<string[]>(initialTermIds ?? [])
  const router = useRouter()
  const supabase = createClient()
  const isEditing = !!instructor

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: instructor ? {
      full_name: instructor.full_name,
      slug: instructor.slug,
      title: instructor.title ?? '',
      bio: instructor.bio ?? '',
      linkedin_url: instructor.linkedin_url ?? '',
      sort_order: instructor.sort_order,
    } : { sort_order: 0 },
  })

  const onSubmit = async (data: FormData) => {
    const payload = { ...data, avatar_url: avatarUrl, linkedin_url: data.linkedin_url || null, title: data.title || null, bio: data.bio || null }

    let instructorId = instructor?.id
    if (isEditing) {
      const { error } = await supabase.from('instructors').update(payload).eq('id', instructor.id)
      if (error) { toast.error(error.message); return }
    } else {
      const { data: created, error } = await supabase.from('instructors').insert(payload).select().single()
      if (error) { toast.error(error.message); return }
      instructorId = created.id
      onCreated?.(created as Instructor)
      reset({ sort_order: 0 })
      setAvatarUrl(null)
    }

    // Sync classificazioni docente, solo se il picker è attivo
    if (taxonomies && instructorId) {
      const { error: deleteError } = await supabase.from('instructor_terms').delete().eq('instructor_id', instructorId)
      if (deleteError) { toast.error(`Errore classificazioni: ${deleteError.message}`); return }
      if (termIds.length > 0) {
        const { error: insertError } = await supabase
          .from('instructor_terms')
          .insert(termIds.map((term_id) => ({ instructor_id: instructorId, term_id })))
        if (insertError) { toast.error(`Errore classificazioni: ${insertError.message}`); return }
      }
      if (!isEditing) setTermIds([])
    }

    toast.success(isEditing ? 'Docente aggiornato!' : 'Docente creato!')
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      {isEditing ? (
        <button onClick={() => setOpen(true)} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-surface-elevated transition-colors">
          <Edit2 className="w-4 h-4" />
        </button>
      ) : compact ? (
        <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1 text-xs text-brand hover:text-brand-light transition-colors">
          <Plus className="w-3 h-3" /> Nuovo docente
        </button>
      ) : (
        <button onClick={() => setOpen(true)} className="btn-primary text-sm gap-2 inline-flex items-center">
          <Plus className="w-4 h-4" /> Nuovo docente
        </button>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-surface-card border border-surface-border rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">{isEditing ? 'Modifica docente' : 'Nuovo docente'}</h3>
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input {...register('full_name')} id="fn" label="Nome completo" placeholder="Paolo Neri" error={errors.full_name?.message}
                onChange={(e) => { register('full_name').onChange(e); if (!isEditing) setValue('slug', slugify(e.target.value)) }} />
              <Input {...register('slug')} id="slug" label="Slug URL" placeholder="paolo-neri" error={errors.slug?.message} />
              <Input {...register('title')} id="title" label="Titolo / qualifica" placeholder="Avvocato tributarista" />
              <div>
                <label className="label">Bio</label>
                <textarea {...register('bio')} rows={4} className="input resize-none text-sm" />
              </div>
              <Input {...register('linkedin_url')} id="li" label="LinkedIn URL" placeholder="https://linkedin.com/in/..." error={errors.linkedin_url?.message} />
              <Input {...register('sort_order')} id="ord" type="number" label="Ordine (0 = primo)" />

              {taxonomies && taxonomies.length > 0 && (
                <div>
                  <label className="label">Classificazioni</label>
                  <TermsPicker taxonomies={taxonomies} value={termIds} onChange={setTermIds} />
                </div>
              )}

              <div>
                <label className="label">Foto profilo</label>
                <FileUpload
                  accept="image/*"
                  maxSizeMB={2}
                  label="Carica immagine"
                  currentName={avatarUrl ? avatarUrl.split('/').pop() : null}
                  buildPath={(file) => {
                    const slug = watch('slug')
                    if (!slug) {
                      toast.error('Inserisci prima il nome del docente')
                      return null
                    }
                    return `instructors/${slug}/avatar.${file.name.split('.').pop()}`
                  }}
                  onUploaded={({ publicUrl }) => setAvatarUrl(publicUrl)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" loading={isSubmitting} size="sm" className="gap-1.5">
                  <Save className="w-3.5 h-3.5" /> {isEditing ? 'Salva' : 'Crea'}
                </Button>
                <Button onClick={() => setOpen(false)} type="button" variant="ghost" size="sm">Annulla</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
