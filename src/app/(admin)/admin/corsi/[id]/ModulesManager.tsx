'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ChevronDown, Save, Video, FileText, BookOpen, HelpCircle, Edit2, ListVideo } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import FileUpload from '@/components/admin/FileUpload'
import QuizEditor from './QuizEditor'
import { PROTECTED_BUCKET } from '@/lib/media'
import { formatSeconds } from '@/lib/utils'
import type { Module, Lesson, LessonType, LessonChapter } from '@/types'

/** "mm:ss", "h:mm:ss" o secondi puri → secondi. null se non valido. */
function parseTimestamp(v: string): number | null {
  const s = v.trim()
  if (!s) return null
  if (/^\d+$/.test(s)) return parseInt(s, 10)
  const parts = s.split(':')
  if (parts.some((p) => !/^\d+$/.test(p.trim()))) return null
  return parts.reduce((acc, p) => acc * 60 + parseInt(p.trim(), 10), 0)
}

interface Props {
  courseId: string
  initialModules: (Module & { lessons: Lesson[] })[]
  /** Corso accreditato FPC: la durata dei video diventa obbligatoria (è il
   *  metro del "completamento verificato" → sblocco e crediti) */
  fpcAccredited?: boolean
}

const LESSON_TYPE_ICONS: Record<LessonType, React.ElementType> = {
  video: Video,
  text: BookOpen,
  pdf: FileText,
  quiz: HelpCircle,
}

export default function ModulesManager({ courseId, initialModules, fpcAccredited = false }: Props) {
  const [modules, setModules] = useState(initialModules)
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [addingModule, setAddingModule] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const addModule = async () => {
    if (!newModuleTitle.trim()) return
    setAddingModule(true)
    const { data, error } = await supabase
      .from('modules')
      .insert({ course_id: courseId, title: newModuleTitle, sort_order: modules.length })
      .select()
      .single()
    if (error) { toast.error(error.message); setAddingModule(false); return }
    setModules([...modules, { ...data, lessons: [] }])
    setNewModuleTitle('')
    setAddingModule(false)
    toast.success('Modulo aggiunto')
  }

  const deleteModule = async (moduleId: string) => {
    if (!confirm('Eliminare il modulo e tutte le sue lezioni?')) return
    const { error } = await supabase.from('modules').delete().eq('id', moduleId)
    if (error) { toast.error(error.message); return }
    setModules(modules.filter((m) => m.id !== moduleId))
    toast.success('Modulo eliminato')
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {modules.map((module, mi) => (
        <ModuleItem
          key={module.id}
          module={module}
          courseId={courseId}
          fpcAccredited={fpcAccredited}
          onDelete={() => deleteModule(module.id)}
          onLessonsChange={(lessons) => {
            const updated = [...modules]
            updated[mi] = { ...module, lessons }
            setModules(updated)
          }}
        />
      ))}

      {/* Add module */}
      <div className="card p-4">
        <div className="flex gap-3">
          <input
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
            placeholder="Titolo nuovo modulo..."
            className="input flex-1 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && addModule()}
          />
          <Button onClick={addModule} loading={addingModule} size="sm" className="gap-1.5 shrink-0">
            <Plus className="w-3.5 h-3.5" /> Aggiungi modulo
          </Button>
        </div>
      </div>
    </div>
  )
}

function ModuleItem({ module, courseId, fpcAccredited, onDelete, onLessonsChange }: {
  module: Module & { lessons: Lesson[] }
  courseId: string
  fpcAccredited: boolean
  onDelete: () => void
  onLessonsChange: (lessons: Lesson[]) => void
}) {
  const [open, setOpen] = useState(true)
  const [lessons, setLessons] = useState(module.lessons ?? [])
  const [addingLesson, setAddingLesson] = useState(false)
  const [newLesson, setNewLesson] = useState({ title: '', type: 'video' as LessonType })
  const supabase = createClient()

  const addLesson = async () => {
    if (!newLesson.title.trim()) return
    setAddingLesson(true)
    const { data, error } = await supabase
      .from('lessons')
      .insert({
        module_id: module.id,
        course_id: courseId,
        title: newLesson.title,
        type: newLesson.type,
        sort_order: lessons.length,
      })
      .select()
      .single()
    if (error) { toast.error(error.message); setAddingLesson(false); return }
    const updated = [...lessons, data as Lesson]
    setLessons(updated)
    onLessonsChange(updated)
    setNewLesson({ title: '', type: 'video' })
    setAddingLesson(false)
    toast.success('Lezione aggiunta')
  }

  const deleteLesson = async (lessonId: string) => {
    const { error } = await supabase.from('lessons').delete().eq('id', lessonId)
    if (error) { toast.error(error.message); return }
    const updated = lessons.filter((l) => l.id !== lessonId)
    setLessons(updated)
    onLessonsChange(updated)
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-surface-elevated cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-3">
          <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${open ? '' : '-rotate-90'}`} />
          <span className="font-medium text-white text-sm">{module.title}</span>
          <span className="text-xs text-white/30">{lessons.length} lezioni</span>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onDelete() }} className="p-1 text-white/30 hover:text-red-400 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {open && (
        <div className="divide-y divide-surface-border">
          {lessons.sort((a, b) => a.sort_order - b.sort_order).map((lesson) => {
            const Icon = LESSON_TYPE_ICONS[lesson.type]
            const missingDuration = fpcAccredited && lesson.type === 'video' && !(lesson.duration_seconds && lesson.duration_seconds > 0)
            return (
              <div key={lesson.id} className="flex items-center gap-3 px-4 py-3">
                <Icon className="w-4 h-4 text-white/30 shrink-0" />
                <span className="text-sm text-white/70 flex-1">{lesson.title}</span>
                {missingDuration && (
                  <span className="text-xs text-red-400" title="Su un corso accreditato ogni video deve avere la durata: è il metro del tempo di visione verificato">
                    durata mancante
                  </span>
                )}
                {lesson.type === 'video' && lesson.duration_seconds ? (
                  <span className="text-xs text-white/30 tabular-nums">{formatSeconds(lesson.duration_seconds)}</span>
                ) : null}
                <span className="text-xs text-white/30 capitalize">{lesson.type}</span>
                <LessonEditButton
                  lesson={lesson}
                  courseId={courseId}
                  fpcAccredited={fpcAccredited}
                  onSaved={(fields) => {
                    const updated = lessons.map((l) => (l.id === lesson.id ? { ...l, ...fields } : l))
                    setLessons(updated)
                    onLessonsChange(updated)
                  }}
                />
                <button onClick={() => deleteLesson(lesson.id)} className="p-1 text-white/20 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}

          {/* Add lesson */}
          <div className="p-3 flex gap-2">
            <select
              value={newLesson.type}
              onChange={(e) => setNewLesson((p) => ({ ...p, type: e.target.value as LessonType }))}
              className="input text-xs w-32 py-2"
            >
              <option value="video">Video</option>
              <option value="text">Testo</option>
              <option value="pdf">PDF</option>
              <option value="quiz">Quiz</option>
            </select>
            <input
              value={newLesson.title}
              onChange={(e) => setNewLesson((p) => ({ ...p, title: e.target.value }))}
              placeholder="Titolo lezione..."
              className="input text-xs flex-1 py-2"
              onKeyDown={(e) => e.key === 'Enter' && addLesson()}
            />
            <Button onClick={addLesson} loading={addingLesson} size="sm" variant="secondary">
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
          <p className="px-3 pb-3 text-xs text-white/30">
            Dopo aver aggiunto la lezione, clicca la matita per inserire il contenuto (link o file video, testo, PDF).
          </p>
        </div>
      )}
    </div>
  )
}

/** Editor capitoli di un video: titolo + tempo d'inizio (mm:ss).
 *  Insert/delete immediati (come moduli/lezioni), auto-caricamento all'apertura. */
function ChapterEditor({ lessonId }: { lessonId: string }) {
  const supabase = createClient()
  const [chapters, setChapters] = useState<LessonChapter[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [ts, setTs] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    supabase
      .from('lesson_chapters')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('start_seconds')
      .then(({ data }) => {
        setChapters((data ?? []) as LessonChapter[])
        setLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId])

  const add = async () => {
    const start = parseTimestamp(ts)
    if (!title.trim() || start === null) {
      toast.error('Serve un titolo e un tempo valido (es. 24:50)')
      return
    }
    setAdding(true)
    const { data, error } = await supabase
      .from('lesson_chapters')
      .insert({ lesson_id: lessonId, title: title.trim(), start_seconds: start, sort_order: start })
      .select()
      .single()
    if (error) { toast.error(error.message); setAdding(false); return }
    setChapters((prev) => [...prev, data as LessonChapter].sort((a, b) => a.start_seconds - b.start_seconds))
    setTitle('')
    setTs('')
    setAdding(false)
  }

  const remove = async (id: string) => {
    const { error } = await supabase.from('lesson_chapters').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    setChapters((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <div className="border-t border-surface-border pt-4">
      <div className="flex items-center gap-2 mb-2">
        <ListVideo className="w-4 h-4 text-white/70" />
        <label className="label mb-0">Capitoli del video</label>
      </div>
      <p className="text-xs text-white/40 mb-3">
        Suddividi il video in sezioni titolate come su YouTube. Il tempo è l&apos;inizio del capitolo (mm:ss).
      </p>

      {loading ? (
        <p className="text-xs text-white/30">Caricamento…</p>
      ) : (
        <div className="space-y-1.5 mb-3">
          {chapters.map((ch) => (
            <div key={ch.id} className="flex items-center gap-3 px-3 py-2 rounded-[10px] bg-surface-elevated">
              <span className="text-xs tabular-nums text-white/50 w-12 shrink-0">{formatSeconds(ch.start_seconds)}</span>
              <span className="text-sm text-white/80 flex-1">{ch.title}</span>
              <button onClick={() => remove(ch.id)} className="p-1 text-white/20 hover:text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={ts}
          onChange={(e) => setTs(e.target.value)}
          placeholder="mm:ss"
          className="input text-xs w-20 py-2"
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titolo capitolo…"
          className="input text-xs flex-1 py-2"
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <Button onClick={add} loading={adding} size="sm" variant="secondary">
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}

function LessonEditButton({ lesson, courseId, fpcAccredited, onSaved }: {
  lesson: Lesson
  courseId: string
  fpcAccredited: boolean
  onSaved: (fields: Partial<Lesson>) => void
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  // video_url/pdf_url contengono un URL esterno oppure un path nel bucket (risolto da getMediaUrl)
  const [videoUrl, setVideoUrl] = useState(lesson.video_url ?? '')
  const [pdfPath, setPdfPath] = useState(lesson.pdf_url ?? '')
  const [content, setContent] = useState(lesson.content ?? '')
  const [isPreview, setIsPreview] = useState(lesson.is_preview)
  const [durationTs, setDurationTs] = useState(lesson.duration_seconds ? formatSeconds(lesson.duration_seconds) : '')
  const supabase = createClient()

  const save = async () => {
    const duration = lesson.type === 'video' ? parseTimestamp(durationTs) : null
    if (lesson.type === 'video' && durationTs.trim() && duration === null) {
      toast.error('Durata non valida: usa mm:ss (es. 45:30) o h:mm:ss')
      return
    }
    if (fpcAccredited && lesson.type === 'video' && !duration) {
      toast.error('Su un corso accreditato la durata del video è obbligatoria (serve a verificare il tempo di visione)')
      return
    }
    setSaving(true)
    try {
      const fields = {
        content,
        video_url: videoUrl.trim() || null,
        pdf_url: pdfPath.trim() || null,
        is_preview: isPreview,
        ...(lesson.type === 'video' ? { duration_seconds: duration } : {}),
      }
      const { error } = await supabase.from('lessons').update(fields).eq('id', lesson.id)
      if (error) toast.error(error.message)
      else { toast.success('Lezione salvata!'); onSaved(fields); setOpen(false) }
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} title="Modifica contenuto" className="p-1 text-white/20 hover:text-brand transition-colors">
        <Edit2 className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-surface/50 backdrop-blur-[10px] border border-surface-border rounded-2xl p-6 w-full max-w-2xl space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-white">Modifica lezione: {lesson.title}</h3>

            {lesson.type === 'video' && (
              <>
                <div>
                  <label className="label">Link video (YouTube, Vimeo o URL diretto)</label>
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
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
                    bucket={PROTECTED_BUCKET}
                    buildPath={(file) => `courses/${courseId}/lessons/${lesson.id}/video.${file.name.split('.').pop()}`}
                    onUploaded={({ path }) => {
                      setVideoUrl(path)
                      toast.success('Video caricato — ricordati di salvare')
                    }}
                  />
                </div>
                <div>
                  <label className="label">Durata del video (mm:ss){fpcAccredited ? ' — obbligatoria sui corsi accreditati' : ''}</label>
                  <input
                    type="text"
                    value={durationTs}
                    onChange={(e) => setDurationTs(e.target.value)}
                    placeholder="es. 45:30"
                    className="input text-sm w-40"
                  />
                  <p className="text-xs text-white/40 mt-1.5">
                    È il metro del tempo di visione: compare nell&apos;elenco lezioni e, sui corsi accreditati,
                    decide quando una lezione risulta completata davvero (95% del tempo).
                  </p>
                </div>
                <ChapterEditor lessonId={lesson.id} />
              </>
            )}

            {lesson.type === 'pdf' && (
              <div>
                <label className="label">PDF</label>
                <FileUpload
                  accept=".pdf,application/pdf"
                  maxSizeMB={10}
                  label="Carica PDF (max 10 MB)"
                  bucket={PROTECTED_BUCKET}
                  currentName={pdfPath ? pdfPath.split('/').pop() : null}
                  buildPath={() => `courses/${courseId}/lessons/${lesson.id}/doc.pdf`}
                  onUploaded={({ path }) => {
                    setPdfPath(path)
                    toast.success('PDF caricato — ricordati di salvare')
                  }}
                />
              </div>
            )}

            {lesson.type === 'text' && (
              <div>
                <label className="label">Contenuto testuale</label>
                <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} className="input resize-none text-sm" />
              </div>
            )}

            {lesson.type === 'quiz' && <QuizEditor lessonId={lesson.id} />}

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isPreview} onChange={(e) => setIsPreview(e.target.checked)} className="accent-brand w-4 h-4" />
              <span className="text-sm text-white/70">Disponibile come anteprima gratuita</span>
            </label>

            <div className="flex gap-3 pt-2">
              <Button onClick={save} loading={saving} size="sm" className="gap-1.5">
                <Save className="w-3.5 h-3.5" /> Salva
              </Button>
              <Button onClick={() => setOpen(false)} variant="ghost" size="sm">Annulla</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
