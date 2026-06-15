'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Save, ChevronUp, ChevronDown, X } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import type { QuizQuestion } from '@/types'

/** Editor delle domande di una lezione-quiz (scrive su quiz_questions, RLS admin) */
export default function QuizEditor({ lessonId }: { lessonId: string }) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('sort_order')
      setQuestions((data ?? []) as QuizQuestion[])
      setLoading(false)
    }
    load()
  }, [supabase, lessonId])

  const addQuestion = async () => {
    setAdding(true)
    const { data, error } = await supabase
      .from('quiz_questions')
      .insert({
        lesson_id: lessonId,
        question: '',
        options: ['', ''],
        correct_option_index: 0,
        sort_order: questions.length,
      })
      .select()
      .single()
    setAdding(false)
    if (error) { toast.error(error.message); return }
    setQuestions((prev) => [...prev, data as QuizQuestion])
  }

  const removeQuestion = async (id: string) => {
    if (!confirm('Eliminare questa domanda?')) return
    const { error } = await supabase.from('quiz_questions').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= questions.length) return
    const reordered = [...questions]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    setQuestions(reordered)
    // Persiste i due sort_order scambiati
    await Promise.all(
      reordered.map((q, i) =>
        supabase.from('quiz_questions').update({ sort_order: i }).eq('id', q.id)
      )
    )
  }

  const patchLocal = (id: string, patch: Partial<QuizQuestion>) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)))
  }

  if (loading) return <p className="text-sm text-muted py-4">Caricamento domande…</p>

  return (
    <div className="space-y-4">
      {questions.length === 0 && (
        <p className="text-sm text-muted">Nessuna domanda. Aggiungine una qui sotto.</p>
      )}

      {questions.map((q, i) => (
        <QuestionCard
          key={q.id}
          question={q}
          index={i}
          total={questions.length}
          onPatch={(patch) => patchLocal(q.id, patch)}
          onMove={(dir) => move(i, dir)}
          onDelete={() => removeQuestion(q.id)}
        />
      ))}

      <Button onClick={addQuestion} loading={adding} variant="secondary" size="sm" className="gap-1.5">
        <Plus className="w-3.5 h-3.5" /> Aggiungi domanda
      </Button>
    </div>
  )
}

function QuestionCard({ question, index, total, onPatch, onMove, onDelete }: {
  question: QuizQuestion
  index: number
  total: number
  onPatch: (patch: Partial<QuizQuestion>) => void
  onMove: (dir: -1 | 1) => void
  onDelete: () => void
}) {
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const setOption = (i: number, value: string) => {
    const options = [...question.options]
    options[i] = value
    onPatch({ options })
  }

  const addOption = () => onPatch({ options: [...question.options, ''] })

  const removeOption = (i: number) => {
    if (question.options.length <= 2) {
      toast.error('Servono almeno 2 opzioni')
      return
    }
    const options = question.options.filter((_, idx) => idx !== i)
    // Riallinea l'indice della risposta corretta
    let correct = question.correct_option_index
    if (i === correct) correct = 0
    else if (i < correct) correct -= 1
    onPatch({ options, correct_option_index: correct })
  }

  const save = async () => {
    if (!question.question.trim()) { toast.error('Inserisci il testo della domanda'); return }
    if (question.options.some((o) => !o.trim())) { toast.error('Compila tutte le opzioni'); return }
    setSaving(true)
    const { error } = await supabase
      .from('quiz_questions')
      .update({
        question: question.question.trim(),
        options: question.options.map((o) => o.trim()),
        correct_option_index: question.correct_option_index,
        explanation: question.explanation?.trim() || null,
      })
      .eq('id', question.id)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success(`Domanda ${index + 1} salvata`)
  }

  return (
    <div className="border border-surface-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">Domanda {index + 1}</span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className="p-1 text-white/30 hover:text-white disabled:opacity-30 transition-colors">
            <ChevronUp className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} className="p-1 text-white/30 hover:text-white disabled:opacity-30 transition-colors">
            <ChevronDown className="w-4 h-4" />
          </button>
          <button type="button" onClick={onDelete} className="p-1 text-white/30 hover:text-red-400 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <textarea
        value={question.question}
        onChange={(e) => onPatch({ question: e.target.value })}
        rows={2}
        placeholder="Testo della domanda"
        className="input resize-none text-sm"
      />

      <div className="space-y-2">
        <p className="text-xs text-muted">Opzioni (seleziona quella corretta)</p>
        {question.options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              name={`correct-${question.id}`}
              checked={question.correct_option_index === i}
              onChange={() => onPatch({ correct_option_index: i })}
              className="accent-brand w-4 h-4 shrink-0"
              aria-label={`Segna opzione ${i + 1} come corretta`}
            />
            <input
              value={opt}
              onChange={(e) => setOption(i, e.target.value)}
              placeholder={`Opzione ${i + 1}`}
              className="input text-sm flex-1 py-2"
            />
            <button type="button" onClick={() => removeOption(i)} className="p-1 text-white/20 hover:text-red-400 transition-colors shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button type="button" onClick={addOption} className="text-xs text-muted hover:text-white transition-colors inline-flex items-center gap-1">
          <Plus className="w-3 h-3" /> Aggiungi opzione
        </button>
      </div>

      <div>
        <label className="text-xs text-muted">Spiegazione (facoltativa, mostrata dopo la risposta)</label>
        <textarea
          value={question.explanation ?? ''}
          onChange={(e) => onPatch({ explanation: e.target.value })}
          rows={2}
          placeholder="Perché questa è la risposta corretta…"
          className="input resize-none text-sm mt-1"
        />
      </div>

      <Button onClick={save} loading={saving} size="sm" className="gap-1.5">
        <Save className="w-3.5 h-3.5" /> Salva domanda
      </Button>
    </div>
  )
}
