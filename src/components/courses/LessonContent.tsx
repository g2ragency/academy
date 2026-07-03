'use client'

import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, FileText, BookOpen, ListVideo, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { getProtectedMediaUrl } from '@/lib/media'
import { Button } from '@/components/ui/Button'
import GatedVideo, { type GatedVideoHandle } from './GatedVideo'
import ChapterList from './ChapterList'
import type { Lesson, QuizQuestion } from '@/types'

interface Props {
  lesson: Lesson & { quiz_questions?: QuizQuestion[] }
  courseId: string
  userId: string
  initialCompleted: boolean
  initialProgressSeconds: number
  poster?: string | null
  /** Notifica il completamento (video visto, quiz superato, o "segna completata") */
  onCompleted?: () => void
  /** Propaga il punto massimo visto (per non perdere la ripresa cambiando lezione) */
  onProgressSeconds?: (seconds: number) => void
  /** Mostra i capitoli del video sotto al player (default: sì se presenti) */
  showChapters?: boolean
}

/**
 * Contenuto di UNA lezione (video gated / quiz / pdf / testo) con salvataggio
 * progresso e completamento. Riusato inline nella watch page ([[CoursePlayer]])
 * per riprodurre la lezione attiva del modulo, senza duplicare la logica.
 */
export default function LessonContent({
  lesson,
  courseId,
  userId,
  initialCompleted,
  initialProgressSeconds,
  poster,
  onCompleted,
  onProgressSeconds,
  showChapters = true,
}: Props) {
  const [completed, setCompleted] = useState(initialCompleted)
  const [marking, setMarking] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [retakingQuiz, setRetakingQuiz] = useState(false)
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [pdfHref, setPdfHref] = useState<string | null>(null)
  const playerRef = useRef<GatedVideoHandle>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [maxWatched, setMaxWatched] = useState(initialProgressSeconds)
  const chapters = lesson.chapters ?? []
  const supabase = createClient()

  // Reset dello stato quando cambia la lezione attiva (switch nel curriculum)
  useEffect(() => {
    setCompleted(initialCompleted)
    setQuizAnswers({})
    setQuizSubmitted(false)
    setRetakingQuiz(false)
    setVideoSrc(null)
    setPdfHref(null)
    setCurrentTime(0)
    setMaxWatched(initialProgressSeconds)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id])

  useEffect(() => {
    let cancelled = false
    if (lesson.video_url) {
      getProtectedMediaUrl(supabase, lesson.video_url).then((url) => !cancelled && setVideoSrc(url))
    }
    if (lesson.pdf_url) {
      getProtectedMediaUrl(supabase, lesson.pdf_url).then((url) => !cancelled && setPdfHref(url))
    }
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id, lesson.video_url, lesson.pdf_url])

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
      onCompleted?.()
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
    <>
      {/* Video (gated: prima visione senza salti in avanti) */}
      {lesson.type === 'video' && lesson.video_url && (
        <>
          <div className="aspect-video bg-surface-elevated rounded-none md:rounded-[30px] overflow-hidden relative">
            {videoSrc ? (
              <GatedVideo
                ref={playerRef}
                src={videoSrc}
                poster={poster}
                lessonId={lesson.id}
                courseId={courseId}
                userId={userId}
                initialMaxWatched={initialProgressSeconds}
                initialCompleted={initialCompleted}
                onProgress={(t) => {
                  setCurrentTime(t)
                  setMaxWatched((m) => {
                    const next = Math.max(m, t)
                    if (next > m) onProgressSeconds?.(next)
                    return next
                  })
                }}
                onCompleted={() => { setCompleted(true); onCompleted?.() }}
                className="absolute inset-0 w-full h-full bg-black"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-white/30 text-sm">
                Caricamento video…
              </div>
            )}
          </div>

          {!completed && (
            <p className="mt-3 text-sm text-muted flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0" />
              Alla prima visione non puoi saltare in avanti (puoi riavvolgere e accelerare).
            </p>
          )}

          {showChapters && chapters.length > 0 && (
            <div className="card p-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <ListVideo className="w-4 h-4 text-white" />
                <span className="text-sm text-white">Capitoli</span>
              </div>
              <ChapterList
                chapters={chapters}
                currentTime={currentTime}
                maxWatched={maxWatched}
                completed={completed}
                onSeek={(s) => playerRef.current?.seekTo(s)}
              />
            </div>
          )}
        </>
      )}

      {/* Testo */}
      {lesson.type === 'text' && lesson.content && (
        <div className="card p-6">
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
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-brand" />
            <span className="text-sm font-medium text-white">Documento PDF</span>
          </div>
          {pdfHref ? (
            <a href={pdfHref} target="_blank" rel="noopener noreferrer" className="btn-secondary inline-flex text-sm gap-2">
              <FileText className="w-4 h-4" />
              Apri PDF
            </a>
          ) : (
            <span className="text-sm text-white/30">Caricamento…</span>
          )}
        </div>
      )}

      {/* Quiz già superato in una sessione precedente: mostra lo stato invece
          di riproporlo "da fare" (con opzione per rifarlo). */}
      {lesson.type === 'quiz' && completed && !quizSubmitted && !retakingQuiz && (
        <div className="card p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white">
            <CheckCircle2 className="w-5 h-5 fill-white text-black shrink-0" />
            Quiz già superato
          </div>
          <Button onClick={() => setRetakingQuiz(true)} variant="secondary" size="sm">
            Rifai il quiz
          </Button>
        </div>
      )}

      {/* Quiz */}
      {lesson.type === 'quiz' && lesson.quiz_questions && lesson.quiz_questions.length > 0 && !(completed && !quizSubmitted && !retakingQuiz) && (
        <div className="space-y-6">
          {lesson.quiz_questions.sort((a, b) => a.sort_order - b.sort_order).map((q, qi) => (
            <div key={q.id} className="card p-5">
              <p className="font-medium text-white mb-4">{qi + 1}. {q.question}</p>
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

      {/* "Segna come completata" solo per testo/PDF: non hanno un segnale
          naturale di completamento. Il video si completa da solo alla fine
          (il gating impone di guardarlo), il quiz superandolo → lì il bottone
          sarebbe una scorciatoia per bypassare la visione. */}
      {(lesson.type === 'text' || lesson.type === 'pdf') && (
        <Button
          onClick={markComplete}
          loading={marking}
          disabled={completed}
          variant={completed ? 'secondary' : 'primary'}
          className="gap-2 mt-6"
        >
          <CheckCircle2 className="w-4 h-4" />
          {completed ? 'Lezione completata' : 'Segna come completata'}
        </Button>
      )}

      {/* Fallback: lezione senza contenuto caricato (es. video senza URL) */}
      {!(
        (lesson.type === 'video' && lesson.video_url) ||
        (lesson.type === 'text' && lesson.content) ||
        (lesson.type === 'pdf' && lesson.pdf_url) ||
        (lesson.type === 'quiz' && (lesson.quiz_questions?.length ?? 0) > 0)
      ) && (
        <div className="card p-6 text-sm text-muted">
          Contenuto non ancora disponibile per questa lezione.
        </div>
      )}
    </>
  )
}
