'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus, Edit2, X, Save, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { slugify } from '@/lib/utils'
import type { Instructor } from '@/types'

const schema = z.object({
  full_name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  title: z.string().optional(),
  bio: z.string().optional(),
  linkedin_url: z.string().url('URL non valido').optional().or(z.literal('')),
  sort_order: z.coerce.number().min(0),
})
type FormData = z.infer<typeof schema>

interface Props { instructor?: Instructor }

export default function InstructorFormModal({ instructor }: Props) {
  const [open, setOpen] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const isEditing = !!instructor

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
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
    let avatar_url = instructor?.avatar_url ?? null

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const path = `instructors/${data.slug}/avatar.${ext}`
      const { error } = await supabase.storage.from('academy').upload(path, avatarFile, { upsert: true })
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('academy').getPublicUrl(path)
        avatar_url = publicUrl
      }
    }

    const payload = { ...data, avatar_url, linkedin_url: data.linkedin_url || null, title: data.title || null, bio: data.bio || null }

    if (isEditing) {
      const { error } = await supabase.from('instructors').update(payload).eq('id', instructor.id)
      if (error) { toast.error(error.message); return }
    } else {
      const { error } = await supabase.from('instructors').insert(payload)
      if (error) { toast.error(error.message); return }
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

              <div>
                <label className="label">Foto profilo</label>
                <label className="flex items-center gap-3 border border-dashed border-surface-border rounded-xl p-4 cursor-pointer hover:border-brand/40">
                  <Upload className="w-5 h-5 text-white/30" />
                  <span className="text-sm text-white/40">{avatarFile ? avatarFile.name : 'Carica immagine'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} />
                </label>
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
