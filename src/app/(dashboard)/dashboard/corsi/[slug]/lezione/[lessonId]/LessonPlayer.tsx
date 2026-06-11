'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ChevronLeft, ChevronRight, FileText, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import type { Lesson, QuizQuestion } from '@/types'

interface Props {
  lesson: Lesson & { quiz_questions: QuizQuestion[] }
  courseId: string
  courseSlug: string
  userId: string
  isCompleted: boolean
  prevLesson: { id: string; title: string } | null
  nextLesson: { id: string; title: string } | null
}

export default function LessonPlayer({ lesson, courseId, courseSlug, userId, isCompleted: initialCompleted, prevLesson, nextLesson }: Props) {
  const [completed, setCompleted] = useState(initialCompleted)
  const [marking, setMarking] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const markComplete = async () => {
    setMarking(true)
    const { error } = await supabase
      .from('lesson_progress')
      .upsert({
        user_id: userId,
        lesson_id: lesson.id,
        course_id: courseId,
        completed: true,
        completed_at: new Date().toISOString(),
      }, { onConflict: 'user_id,lesson_id' })

    if (error) {
      toast.error('Errore nel salvataggio del progresso')
    } else {
      setCompleted(true)
      toast.success('Lezione completata!')
      router.refresh()
    }
    setMarking(false)
  }

  const handleQuizSubmit = async () => {
    const questions = lesson.quiz_questions ?? []
    let score = 0
    questions.forEach((q) => {
      if (quizAnswers[q.id] === q.correct_option_index) score++
    })
    const pct = Math.round((score / questions.length) * 100)
    const passed = pct >= 70

    await supabase.from('quiz_attempts').insert({
      user_id: userId,
      lesson_id: lesson.id,
      answers: Object.values(quizAnswers),
      score: pct,
      passed,
    })

    setQuizSubmitted(true)
    if (passed) {
      await markComplete()
      toast.success(`Quiz superato! Punteggio: ${pct}%`)
    } else {
      toast.error(`Non hai superato il quiz. Punteggio: ${pct}%. Riprova!`)
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Video/content area */}
      <div className="flex-1 p-6 lg:p-8 max-w-4xl w-full mx-auto">
        <h1 className="font-bold text-white mb-6">{lesson.title}</h1>

        {/* Video */}
        {lesson.type === 'video' && lesson.video_url && (
          <div className="aspect-video bg-surface-card rounded-2xl overflow-hidden mb-6 relative">
            <video
              src={lesson.video_url}
              controls
              className="w-full h-full"
              onEnded={() => !completed && markComplete()}
            />
          </div>
        )}

        {/* Text content */}
        {lesson.type === 'text' && lesson.content && (
          <div className="card p-6 mb-6">
            <div className="flex items-center gap-2 mb-4 text-brand">
              <BookOpen className="w-4 h-4" />
              <span className="text-sm font-medium">Contenuto testuale</span>
            </div>
            <div className="text-white/70 leading-relaxed whitespace-pre-line prose prose-invert max-w-none">
              {lesson.content}
            </div>
          </div>
        )}

        {/* PDF */}
        {lesson.type === 'pdf' && lesson.pdf_url && (
          <div className="card p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-brand" />
              <span className="text-sm font-medium text-white">Documento PDF</span>
            </div>
            <a
              href={lesson.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary inline-flex text-sm gap-2"
            >
              <FileText className="w-4 h-4" />
              Apri PDF
            </a>
          </div>
        )}

        {/* Quiz */}
        {lesson.type === 'quiz' && lesson.quiz_questions && lesson.quiz_questions.length > 0 && (
          <div className="space-y-6 mb-6">
            {lesson.quiz_questions.sort((a, b) => a.sort_order - b.sort_order).map((q, qi) => (
              <div key={q.id} className="card p-5">
                <p className="font-medium text-white mb-4">
                  {qi + 1}. {q.question}
                </p>
                <div className="space-y-2">
                  {q.options.map((option, oi) => {
                    const isSelected = quizAnswers[q.id] === oi
                    const isCorrect = quizSubmitted && oi === q.correct_option_index
                    const isWrong = quizSubmitted && isSelected && oi !== q.correct_option_index
                    return (
                      <button
                        key={oi}
                        disabled={quizSubmitted}
                        onClick={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: oi }))}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm border transition-all ${
                          isCorrect ? 'bg-green-500/20 border-green-500/40 text-green-400' :
                          isWrong ? 'bg-red-500/20 border-red-500/40 text-red-400' :
                          isSelected ? 'bg-brand/15 border-brand/40 text-white' :
                          'bg-surface-elevated border-surface-border text-white/70 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        {option}
                      </button>
                    )
                  })}
                </div>
                {quizSubmitted && q.explanation && (
                  <p className="mt-3 text-xs text-white/50 bg-surface-elevated rounded-lg p-3">{q.explanation}</p>
                )}
              </div>
            ))}

            {!quizSubmitted && (
              <Button
                onClick={handleQuizSubmit}
                disabled={Object.keys(quizAnswers).length < lesson.quiz_questions.length}
                className="w-full"
                size="lg"
              >
                Invia risposte
              </Button>
            )}
          </div>
        )}

        {/* Mark complete button */}
        {lesson.type !== 'quiz' && (
          <Button
            onClick={markComplete}
            loading={marking}
            disabled={completed}
            variant={completed ? 'secondary' : 'primary'}
            className="gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {completed ? 'Lezione completata' : 'Segna come completata'}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <div className="border-t border-surface-border p-4 flex items-center justify-between gap-4 bg-surface-card">
        {prevLesson ? (
          <Link
            href={`/dashboard/corsi/${courseSlug}/lezione/${prevLesson.id}`}
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:block line-clamp-1 max-w-[200px]">{prevLesson.title}</span>
          </Link>
        ) : (
          <div />
        )}

        {nextLesson ? (
          <Link
            href={`/dashboard/corsi/${courseSlug}/lezione/${nextLesson.id}`}
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            <span className="hidden sm:block line-clamp-1 max-w-[200px]">{nextLesson.title}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <Link href={`/dashboard/corsi/${courseSlug}`} className="text-sm text-brand hover:text-brand-light transition-colors">
            Fine corso →
          </Link>
        )}
      </div>
    </div>
  )
}
