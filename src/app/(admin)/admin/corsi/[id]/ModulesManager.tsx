'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ChevronDown, Save, Video, FileText, BookOpen, HelpCircle, Edit2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import FileUpload from '@/components/admin/FileUpload'
import QuizEditor from './QuizEditor'
import { PROTECTED_BUCKET } from '@/lib/media'
import type { Module, Lesson, LessonType } from '@/types'

interface Props {
  courseId: string
  initialModules: (Module & { lessons: Lesson[] })[]
}

const LESSON_TYPE_ICONS: Record<LessonType, React.ElementType> = {
  video: Video,
  text: BookOpen,
  pdf: FileText,
  quiz: HelpCircle,
}

export default function ModulesManager({ courseId, initialModules }: Props) {
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

function ModuleItem({ module, courseId, onDelete, onLessonsChange }: {
  module: Module & { lessons: Lesson[] }
  courseId: string
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
            return (
              <div key={lesson.id} className="flex items-center gap-3 px-4 py-3">
                <Icon className="w-4 h-4 text-white/30 shrink-0" />
                <span className="text-sm text-white/70 flex-1">{lesson.title}</span>
                <span className="text-xs text-white/30 capitalize">{lesson.type}</span>
                <LessonEditButton lesson={lesson} courseId={courseId} />
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

function LessonEditButton({ lesson, courseId }: { lesson: Lesson; courseId: string }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  // video_url/pdf_url contengono un URL esterno oppure un path nel bucket (risolto da getMediaUrl)
  const [videoUrl, setVideoUrl] = useState(lesson.video_url ?? '')
  const [pdfPath, setPdfPath] = useState(lesson.pdf_url ?? '')
  const [content, setContent] = useState(lesson.content ?? '')
  const [isPreview, setIsPreview] = useState(lesson.is_preview)
  const supabase = createClient()

  const save = async () => {
    setSaving(true)
    try {
      const { error } = await supabase.from('lessons').update({
        content,
        video_url: videoUrl.trim() || null,
        pdf_url: pdfPath.trim() || null,
        is_preview: isPreview,
      }).eq('id', lesson.id)
      if (error) toast.error(error.message)
      else { toast.success('Lezione salvata!'); setOpen(false) }
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
          <div className="bg-surface-card border border-surface-border rounded-2xl p-6 w-full max-w-2xl space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
