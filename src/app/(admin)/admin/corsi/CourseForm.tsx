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
import RichTextEditor from '@/components/ui/RichTextEditor'
import type { Course, CourseType, Taxonomy } from '@/types'
import { COURSE_TYPE_LABELS } from '@/types'

const schema = z.object({
  title: z.string().min(3, 'Titolo obbligatorio'),
  slug: z.string().min(2, 'Slug obbligatorio').regex(/^[a-z0-9-]+$/, 'Solo lettere minuscole, numeri e trattini'),
  short_description: z.string().optional(),
  description: z.string().optional(),
  /** "Gli argomenti trattati": un argomento per riga */
  topics_text: z.string().optional(),
  type: z.enum(['webinar', 'masterclass', 'fast_focus', 'short_master', 'executive_master']),
  status: z.enum(['draft', 'published', 'archived']),
  price_euros: z.coerce.number().min(0),
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
  /** Relatori del corso (course_instructors), in ordine */
  initialInstructorIds?: string[]
}

export default function CourseForm({ course, instructors, taxonomies, initialTermIds, initialInstructorIds = [] }: Props) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(course?.thumbnail_url ?? null)
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(course?.preview_video_url ?? null)
  const [programPdfUrl, setProgramPdfUrl] = useState<string | null>(course?.program_pdf_url ?? null)
  const [termIds, setTermIds] = useState<string[]>(initialTermIds)
  const [instructorIds, setInstructorIds] = useState<string[]>(initialInstructorIds)
  const [instructorList, setInstructorList] = useState(instructors)
  const router = useRouter()
  const supabase = createClient()
  const isEditing = !!course

  const toggleInstructor = (id: string) => {
    setInstructorIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: course ? {
      title: course.title,
      slug: course.slug,
      short_description: course.short_description ?? '',
      description: course.description ?? '',
      topics_text: (course.topics ?? []).join('\n'),
      type: course.type,
      status: course.status,
      price_euros: course.price_cents / 100,
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
    const { price_euros, topics_text, ...fields } = data
    const topics = (topics_text ?? '')
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean)
    const payload = {
      ...fields,
      price_cents: Math.round(price_euros * 100),
      thumbnail_url: thumbnailUrl,
      preview_video_url: previewVideoUrl,
      program_pdf_url: programPdfUrl,
      topics: topics.length > 0 ? topics : null,
      // Compat: il primo relatore resta anche nel campo legacy instructor_id
      instructor_id: instructorIds[0] ?? null,
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

    // Sync relatori (course_instructors): delete + insert batch, sort_order = posizione
    const { error: deleteInstructorsError } = await supabase
      .from('course_instructors')
      .delete()
      .eq('course_id', courseId)
    if (deleteInstructorsError) { toast.error(`Errore relatori: ${deleteInstructorsError.message}`); return }
    if (instructorIds.length > 0) {
      const { error: insertInstructorsError } = await supabase
        .from('course_instructors')
        .insert(instructorIds.map((instructor_id, index) => ({ course_id: courseId, instructor_id, sort_order: index })))
      if (insertInstructorsError) { toast.error(`Errore relatori: ${insertInstructorsError.message}`); return }
    }

    toast.success(isEditing ? 'Corso aggiornato!' : 'Corso creato!')
    if (!isEditing) router.push(`/admin/corsi/${courseId}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-6xl">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
      {/* Colonna principale: contenuti del corso */}
      <div className="xl:col-span-2 space-y-6">
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
          <RichTextEditor
            value={watch('short_description')}
            onChange={(html) => setValue('short_description', html, { shouldDirty: true })}
            placeholder="Una breve descrizione del corso..."
            minHeight={80}
          />
        </div>

        <div>
          <label className="label">Descrizione completa</label>
          <RichTextEditor
            value={watch('description')}
            onChange={(html) => setValue('description', html, { shouldDirty: true })}
            placeholder="Descrizione dettagliata del corso, obiettivi, a chi è rivolto..."
            minHeight={160}
          />
        </div>

        <div>
          <label className="label">Argomenti trattati (uno per riga)</label>
          <textarea
            {...register('topics_text')}
            rows={5}
            placeholder={'Contesto della riforma e soggetti interessati\nIl nuovo regime dei dividendi e delle plusvalenze\n...'}
            className="input resize-none"
          />
          <p className="text-xs text-white/40 mt-1.5">
            Compare come elenco puntato nella sezione &quot;Gli argomenti trattati&quot; della pagina corso.
          </p>
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

          <Input
            {...register('duration_minutes')}
            id="duration"
            type="number"
            label="Durata (minuti)"
            placeholder="60"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
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
      </div>

      {/* Colonna laterale: relatori, classificazioni, media */}
      <div className="space-y-6">
      {/* Relatori */}
      <div className="card p-6">
        <div className="flex items-center justify-between border-b border-surface-border pb-3 mb-4">
          <h3 className="font-semibold text-white">Relatori</h3>
          <InstructorFormModal
            compact
            onCreated={(i) => {
              setInstructorList((prev) => [...prev, { id: i.id, full_name: i.full_name }])
              setInstructorIds((prev) => [...prev, i.id])
            }}
          />
        </div>
        {instructorList.length === 0 ? (
          <p className="text-sm text-white/40">Nessun docente disponibile: creane uno con il bottone qui sopra.</p>
        ) : (
          <div className="space-y-2">
            {instructorList.map((i) => (
              <label key={i.id} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={instructorIds.includes(i.id)}
                  onChange={() => toggleInstructor(i.id)}
                  className="w-4 h-4 accent-brand rounded"
                />
                <span className="text-sm text-white/70">{i.full_name}</span>
              </label>
            ))}
          </div>
        )}
        <p className="text-xs text-white/40 mt-3">
          Compaiono nel carosello &quot;Relatori&quot; della pagina corso, nell&apos;ordine di selezione.
        </p>
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

      {/* Video anteprima */}
      <div className="card p-6 space-y-4">
        <h3 className="font-semibold text-white border-b border-surface-border pb-3">Video anteprima</h3>
        <div>
          <label className="label">Link video (YouTube, Vimeo o URL diretto)</label>
          <input
            type="text"
            value={previewVideoUrl ?? ''}
            onChange={(e) => setPreviewVideoUrl(e.target.value || null)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="input text-sm"
          />
        </div>
        <div>
          <label className="label">oppure carica un file video</label>
          <FileUpload
            accept="video/*"
            maxSizeMB={50}
            label="Carica file video (max 50 MB)"
            buildPath={(file) => {
              const slug = watch('slug')
              if (!slug) {
                toast.error('Inserisci prima il titolo del corso')
                return null
              }
              return `courses/${slug}/preview.${file.name.split('.').pop()}`
            }}
            onUploaded={({ publicUrl }) => setPreviewVideoUrl(publicUrl)}
          />
        </div>
        <p className="text-xs text-white/40">
          Mostrato in cima alla pagina del corso. Pubblico, visibile anche a chi non è iscritto.
        </p>
      </div>

      {/* PDF programma */}
      <div className="card p-6">
        <h3 className="font-semibold text-white border-b border-surface-border pb-3 mb-4">Programma (PDF)</h3>
        <FileUpload
          accept="application/pdf"
          maxSizeMB={10}
          label="Clicca per caricare il PDF del programma"
          currentName={programPdfUrl ? programPdfUrl.split('/').pop() : null}
          buildPath={(file) => {
            const slug = watch('slug')
            if (!slug) {
              toast.error('Inserisci prima il titolo del corso')
              return null
            }
            return `courses/${slug}/programma.pdf`
          }}
          onUploaded={({ publicUrl }) => setProgramPdfUrl(publicUrl)}
        />
        <p className="text-xs text-white/40 mt-3">
          Link &quot;Scarica il programma&quot; nel riepilogo della pagina corso. Materiale pubblico (no contenuti riservati).
        </p>
      </div>
      </div>
      </div>

      <Button type="submit" loading={isSubmitting} size="lg" className="gap-2">
        <Save className="w-4 h-4" />
        {isEditing ? 'Salva modifiche' : 'Crea corso'}
      </Button>
    </form>
  )
}
