'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import FileUpload from '@/components/admin/FileUpload'
import TermsPicker from '@/components/admin/TermsPicker'
import InstructorFormModal from '../docenti/InstructorFormModal'
import { slugify } from '@/lib/utils'
import type { Course, CourseType, Taxonomy } from '@/types'
import { COURSE_TYPE_LABELS } from '@/types'

const schema = z.object({
  title: z.string().min(3, 'Titolo obbligatorio'),
  slug: z.string().min(2, 'Slug obbligatorio').regex(/^[a-z0-9-]+$/, 'Solo lettere minuscole, numeri e trattini'),
  short_description: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(['webinar', 'masterclass', 'fast_focus', 'short_master', 'executive_master']),
  status: z.enum(['draft', 'published', 'archived']),
  price_euros: z.coerce.number().min(0),
  instructor_id: z.string().optional(),
  duration_minutes: z.coerce.number().optional(),
  level: z.enum(['base', 'intermedio', 'avanzato']).optional(),
  featured: z.boolean().optional(),
  issues_certificate: z.boolean().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  course?: Course
  instructors: { id: string; full_name: string }[]
  taxonomies: Taxonomy[]
  initialTermIds: string[]
}

export default function CourseForm({ course, instructors, taxonomies, initialTermIds }: Props) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(course?.thumbnail_url ?? null)
  const [termIds, setTermIds] = useState<string[]>(initialTermIds)
  const [instructorList, setInstructorList] = useState(instructors)
  const router = useRouter()
  const supabase = createClient()
  const isEditing = !!course

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: course ? {
      title: course.title,
      slug: course.slug,
      short_description: course.short_description ?? '',
      description: course.description ?? '',
      type: course.type,
      status: course.status,
      price_euros: course.price_cents / 100,
      instructor_id: course.instructor_id ?? '',
      duration_minutes: course.duration_minutes ?? undefined,
      level: course.level ?? undefined,
      featured: course.featured,
      issues_certificate: course.issues_certificate,
    } : {
      type: 'webinar',
      status: 'draft',
      price_euros: 0,
      featured: false,
      issues_certificate: false,
    },
  })

  const titleValue = watch('title')

  const onSubmit = async (data: FormData) => {
    const { price_euros, ...fields } = data
    const payload = {
      ...fields,
      price_cents: Math.round(price_euros * 100),
      thumbnail_url: thumbnailUrl,
      instructor_id: data.instructor_id || null,
      duration_minutes: data.duration_minutes || null,
      level: data.level || null,
    }

    let courseId = course?.id
    if (isEditing) {
      const { error } = await supabase.from('courses').update(payload).eq('id', course.id)
      if (error) { toast.error(error.message); return }
    } else {
      const { data: newCourse, error } = await supabase.from('courses').insert(payload).select().single()
      if (error) { toast.error(error.message); return }
      courseId = newCourse.id
    }

    // Sync classificazioni (course_terms): delete + insert batch
    const { error: deleteError } = await supabase.from('course_terms').delete().eq('course_id', courseId)
    if (deleteError) { toast.error(`Errore classificazioni: ${deleteError.message}`); return }
    if (termIds.length > 0) {
      const { error: insertError } = await supabase
        .from('course_terms')
        .insert(termIds.map((term_id) => ({ course_id: courseId, term_id })))
      if (insertError) { toast.error(`Errore classificazioni: ${insertError.message}`); return }
    }

    toast.success(isEditing ? 'Corso aggiornato!' : 'Corso creato!')
    if (!isEditing) router.push(`/admin/corsi/${courseId}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      {/* Basic info */}
      <div className="card p-6 space-y-4">
        <h3 className="font-semibold text-white border-b border-surface-border pb-3">Informazioni base</h3>

        <Input
          {...register('title')}
          id="title"
          label="Titolo"
          placeholder="PEX & Regime dei Dividendi"
          error={errors.title?.message}
          onChange={(e) => {
            register('title').onChange(e)
            if (!isEditing) setValue('slug', slugify(e.target.value))
          }}
        />

        <Input
          {...register('slug')}
          id="slug"
          label="Slug URL"
          placeholder="pex-regime-dividendi"
          error={errors.slug?.message}
        />

        <div>
          <label className="label">Descrizione breve</label>
          <textarea
            {...register('short_description')}
            rows={2}
            placeholder="Una breve descrizione del corso..."
            className="input resize-none"
          />
        </div>

        <div>
          <label className="label">Descrizione completa</label>
          <textarea
            {...register('description')}
            rows={6}
            placeholder="Descrizione dettagliata del corso, obiettivi, a chi è rivolto..."
            className="input resize-none"
          />
        </div>
      </div>

      {/* Settings */}
      <div className="card p-6 space-y-4">
        <h3 className="font-semibold text-white border-b border-surface-border pb-3">Impostazioni</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Tipo corso</label>
            <select {...register('type')} className="input">
              {(Object.entries(COURSE_TYPE_LABELS) as [CourseType, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Stato</label>
            <select {...register('status')} className="input">
              <option value="draft">Bozza</option>
              <option value="published">Pubblicato</option>
              <option value="archived">Archiviato</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            {...register('price_euros')}
            id="price"
            type="number"
            step="0.01"
            min="0"
            label="Prezzo (€)"
            placeholder="0 = gratuito, 97 = 97€"
            error={errors.price_euros?.message}
          />

          <div>
            <div className="flex items-center justify-between">
              <label className="label">Docente</label>
              <InstructorFormModal
                compact
                onCreated={(i) => {
                  setInstructorList((prev) => [...prev, { id: i.id, full_name: i.full_name }])
                  setValue('instructor_id', i.id)
                }}
              />
            </div>
            <select {...register('instructor_id')} className="input">
              <option value="">— Nessuno —</option>
              {instructorList.map((i) => (
                <option key={i.id} value={i.id}>{i.full_name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            {...register('duration_minutes')}
            id="duration"
            type="number"
            label="Durata (minuti)"
            placeholder="60"
          />

          <div>
            <label className="label">Livello</label>
            <select {...register('level')} className="input">
              <option value="">— Non specificato —</option>
              <option value="base">Base</option>
              <option value="intermedio">Intermedio</option>
              <option value="avanzato">Avanzato</option>
            </select>
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" {...register('featured')} className="w-4 h-4 accent-brand rounded" />
          <span className="text-sm text-white/70">Corso in evidenza (mostrato in homepage)</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" {...register('issues_certificate')} className="w-4 h-4 accent-brand rounded" />
          <span className="text-sm text-white/70">Rilascia attestato al completamento del corso</span>
        </label>
      </div>

      {/* Classificazioni */}
      <div className="card p-6">
        <h3 className="font-semibold text-white border-b border-surface-border pb-3 mb-4">Classificazioni</h3>
        <TermsPicker taxonomies={taxonomies} value={termIds} onChange={setTermIds} />
      </div>

      {/* Thumbnail */}
      <div className="card p-6">
        <h3 className="font-semibold text-white border-b border-surface-border pb-3 mb-4">Immagine copertina</h3>
        <FileUpload
          accept="image/*"
          maxSizeMB={2}
          label="Clicca per caricare un'immagine (JPG, PNG, WebP)"
          currentName={thumbnailUrl ? thumbnailUrl.split('/').pop() : null}
          buildPath={(file) => {
            const slug = watch('slug')
            if (!slug) {
              toast.error('Inserisci prima il titolo del corso')
              return null
            }
            return `courses/${slug}/thumbnail.${file.name.split('.').pop()}`
          }}
          onUploaded={({ publicUrl }) => setThumbnailUrl(publicUrl)}
        />
      </div>

      <Button type="submit" loading={isSubmitting} size="lg" className="gap-2">
        <Save className="w-4 h-4" />
        {isEditing ? 'Salva modifiche' : 'Crea corso'}
      </Button>
    </form>
  )
}
