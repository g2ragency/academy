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
import FileUpload from '@/components/admin/FileUpload'
import FormatIcon from '@/components/icons/FormatIcon'
import { slugify } from '@/lib/utils'
import type { CourseFormat } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Nome obbligatorio'),
  slug: z.string().min(2, 'Slug obbligatorio').regex(/^[a-z0-9_-]+$/, 'Solo minuscole, numeri, - e _'),
  sort_order: z.coerce.number().min(0),
})
type FormData = z.infer<typeof schema>

export default function FormatsManager({ initialFormats }: { initialFormats: CourseFormat[] }) {
  const [formats, setFormats] = useState(initialFormats)
  const [editing, setEditing] = useState<CourseFormat | null | 'new'>(null)
  const supabase = createClient()
  const router = useRouter()

  const deleteFormat = async (format: CourseFormat) => {
    if (!confirm(`Eliminare il formato "${format.name}"?`)) return
    const { error } = await supabase.from('course_formats').delete().eq('id', format.id)
    if (error) {
      toast.error(error.code === '23503'
        ? 'Formato in uso da uno o più corsi: riassegnali prima di eliminarlo.'
        : error.message)
      return
    }
    setFormats((prev) => prev.filter((f) => f.id !== format.id))
    toast.success('Formato eliminato')
    router.refresh()
  }

  return (
    <div className="space-y-3 max-w-3xl">
      {formats.map((format) => (
        <div key={format.id} className="card flex items-center gap-4 px-5 py-4">
          <span className="w-[35px] h-[35px] rounded-[10px] bg-[#888888] flex items-center justify-center shrink-0 text-black">
            <FormatIcon slug={format.slug} iconUrl={format.icon_url} className="w-6 h-6" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[16px] text-white truncate">{format.name}</p>
            <p className="text-[14px] text-white/30">/{format.slug}</p>
          </div>
          <button onClick={() => setEditing(format)} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-surface-elevated transition-colors">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => deleteFormat(format)} className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-surface-elevated transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      <button onClick={() => setEditing('new')} className="btn-primary text-sm gap-2 inline-flex items-center">
        <Plus className="w-4 h-4" /> Nuovo formato
      </button>

      {editing && (
        <FormatFormModal
          format={editing === 'new' ? undefined : editing}
          nextOrder={formats.length}
          onClose={() => setEditing(null)}
          onSaved={(saved, isNew) => {
            setFormats((prev) => (isNew ? [...prev, saved] : prev.map((f) => (f.id === saved.id ? saved : f)))
              .sort((a, b) => a.sort_order - b.sort_order))
            setEditing(null)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

function FormatFormModal({ format, nextOrder, onClose, onSaved }: {
  format?: CourseFormat
  nextOrder: number
  onClose: () => void
  onSaved: (saved: CourseFormat, isNew: boolean) => void
}) {
  const supabase = createClient()
  const isEditing = !!format
  const [iconUrl, setIconUrl] = useState<string | null>(format?.icon_url ?? null)
  const [slug, setSlug] = useState(format?.slug ?? '')

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: format
      ? { name: format.name, slug: format.slug, sort_order: format.sort_order }
      : { sort_order: nextOrder },
  })

  const onSubmit = async (data: FormData) => {
    // Cache-buster sull'URL salvato per riflettere subito un'icona ri-caricata
    const payload = { name: data.name, slug: data.slug, sort_order: data.sort_order, icon_url: iconUrl }
    if (isEditing) {
      const { data: updated, error } = await supabase.from('course_formats').update(payload).eq('id', format.id).select().single()
      if (error) { toast.error(error.code === '23505' ? 'Slug già usato da un altro formato' : error.message); return }
      toast.success('Formato aggiornato')
      onSaved(updated as CourseFormat, false)
    } else {
      const { data: created, error } = await supabase.from('course_formats').insert(payload).select().single()
      if (error) { toast.error(error.code === '23505' ? 'Slug già usato da un altro formato' : error.message); return }
      toast.success('Formato creato')
      onSaved(created as CourseFormat, true)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface/50 backdrop-blur-[10px] border border-surface-border rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-white">{isEditing ? 'Modifica formato' : 'Nuovo formato'}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            {...register('name')}
            id="fmt-name"
            label="Nome"
            placeholder="Convegni & Tavole Rotonde"
            error={errors.name?.message}
            onChange={(e) => {
              register('name').onChange(e)
              if (!isEditing) { const s = slugify(e.target.value); setValue('slug', s); setSlug(s) }
            }}
          />
          <Input
            {...register('slug')}
            id="fmt-slug"
            label="Slug (chiave referenziata dai corsi)"
            placeholder="convegni"
            error={errors.slug?.message}
            readOnly={isEditing}
            onChange={(e) => { register('slug').onChange(e); setSlug(e.target.value) }}
          />
          {isEditing && <p className="-mt-2 text-xs text-white/30">Lo slug non è modificabile: è già referenziato dai corsi.</p>}

          <Input {...register('sort_order')} id="fmt-ord" type="number" label="Ordine (0 = primo)" />

          <div>
            <label className="label">Icona (SVG)</label>
            <div className="flex items-center gap-3">
              <span className="w-[35px] h-[35px] rounded-[10px] bg-[#888888] flex items-center justify-center shrink-0 text-black">
                <FormatIcon slug={slug} iconUrl={iconUrl} className="w-6 h-6" />
              </span>
              <div className="flex-1">
                <FileUpload
                  accept="image/svg+xml,.svg"
                  maxSizeMB={1}
                  label="Carica un'icona SVG"
                  currentName={iconUrl ? iconUrl.split('/').pop() : null}
                  buildPath={(file) => {
                    if (!slug) { toast.error('Inserisci prima il nome (slug)'); return null }
                    const ext = file.name.split('.').pop() || 'svg'
                    return `format-icons/${slug}.${ext}`
                  }}
                  onUploaded={({ publicUrl }) => setIconUrl(`${publicUrl}?t=${Date.now()}`)}
                />
              </div>
              {iconUrl && (
                <button type="button" onClick={() => setIconUrl(null)} className="text-xs text-white/40 hover:text-red-400 shrink-0">Rimuovi</button>
              )}
            </div>
            <p className="text-xs text-white/40 mt-1.5">
              Vuoto = icona interna di default (solo per gli slug noti). Per i formati nuovi carica un SVG.
            </p>
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
