'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Lock, CheckCircle2, ListVideo, Play, HelpCircle, FileText, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getMediaUrl, getProtectedMediaUrl } from '@/lib/media'
import { formatSeconds } from '@/lib/utils'
import ExpandableText from '@/components/ui/ExpandableText'
import InstructorCarousel from '@/app/(public)/corsi/[slug]/InstructorCarousel'
import CourseRowCard from './CourseRowCard'
import GatedVideo, { type GatedVideoHandle } from './GatedVideo'
import ChapterList from './ChapterList'
import LessonContent from './LessonContent'
import type { Course, Instructor, Lesson, LessonChapter, LessonProgress, Module, LessonType, QuizQuestion } from '@/types'

type LessonFull = Lesson & { quiz_questions?: QuizQuestion[]; chapters?: LessonChapter[] }

interface Props {
  course: { id: string; slug: string; title: string; issues_certificate: boolean; description: string | null }
  modules: (Module & { lessons: LessonFull[] })[]
  userId: string
  poster?: string | null
  progressList: LessonProgress[]
  instructors: Instructor[]
  relatedCourses: Course[]
}

const LESSON_ICON: Record<LessonType, React.ElementType> = {
  video: Play,
  quiz: HelpCircle,
  pdf: FileText,
  text: BookOpen,
}

/**
 * Watch page del corso: stesso layout per corso a video-unico e a moduli.
 * - video-unico: video grande + sidebar CAPITOLI (seek nel video).
 * - a moduli: video/lezione attiva inline (via [[LessonContent]]) + sidebar
 *   MODULI con i video dentro; cliccare cambia la lezione SENZA navigare.
 * Sotto (condiviso): descrizione, relatori, corsi correlati — come la pagina-vendita.
 */
export default function CoursePlayer({ course, modules, userId, poster, progressList, instructors, relatedCourses }: Props) {
  const allLessons = useMemo(
    () => modules.flatMap((m) => m.lessons ?? []).sort((a, b) => a.sort_order - b.sort_order),
    [modules],
  )
  const singleVideo = allLessons.length === 1 && allLessons[0]?.type === 'video' && !!allLessons[0]?.video_url

  // Progresso per lezione, in stato (aggiornato al completamento per riflettere subito le spunte)
  const [progress, setProgress] = useState<Record<string, { completed: boolean; progress_seconds: number }>>(() => {
    const m: Record<string, { completed: boolean; progress_seconds: number }> = {}
    for (const p of progressList) m[p.lesson_id] = { completed: p.completed, progress_seconds: p.progress_seconds }
    return m
  })
  const markCompletedLocal = (lessonId: string) =>
    setProgress((prev) => ({ ...prev, [lessonId]: { progress_seconds: prev[lessonId]?.progress_seconds ?? 0, completed: true } }))

  // Descrizione + Relatori: vanno DENTRO la colonna sinistra (come nella
  // pagina-vendita), altrimenti a tutta larghezza le card relatori risultano
  // enormi (InstructorCarousel calcola le card in % del contenitore).
  const belowPlayer = (
    <>
      {course.description && (
        <section className="mt-10 lg:mt-12">
          <div className="border-t border-muted mb-10" />
          <h5 className="text-white leading-none mb-6" style={{ fontSize: 'clamp(1.125rem, 0.737rem + 1.579vw, 2rem)' }}>Descrizione del corso</h5>
          <ExpandableText text={course.description} textClassName="text-white/60 text-[14px] sm:text-[24px] leading-[18px] sm:leading-[32px]" />
        </section>
      )}
      {instructors.length > 0 && (
        <section className="mt-10 lg:mt-12">
          <div className="border-t border-muted mb-10" />
          <InstructorCarousel instructors={instructors} />
        </section>
      )}
    </>
  )

  return (
    <>
      {allLessons.length === 0 ? (
        <div className="card p-10 text-center text-muted">Questo corso non ha ancora contenuti.</div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {singleVideo ? (
            <SingleVideoPlayer
              course={course}
              lesson={allLessons[0]}
              poster={poster}
              userId={userId}
              initialProgressSeconds={progress[allLessons[0].id]?.progress_seconds ?? 0}
              initialCompleted={progress[allLessons[0].id]?.completed ?? false}
              onCompleted={() => markCompletedLocal(allLessons[0].id)}
              belowPlayer={belowPlayer}
            />
          ) : (
            <ModulesPlayer
              course={course}
              modules={modules}
              allLessons={allLessons}
              userId={userId}
              poster={poster}
              progress={progress}
              onLessonCompleted={markCompletedLocal}
              belowPlayer={belowPlayer}
            />
          )}
        </div>
      )}

      {/* Corsi correlati — a tutta larghezza, come "Gli altri utenti hanno seguito anche" */}
      {relatedCourses.length > 0 && (
        <section className="mt-16">
          <div className="border-t border-muted mb-12" />
          <h5 className="text-white leading-none mb-8" style={{ fontSize: 'clamp(1.125rem, 0.737rem + 1.579vw, 2rem)' }}>Corsi correlati</h5>
          <div className="space-y-2.5 sm:space-y-5">
            {relatedCourses.map((related) => (
              <CourseRowCard key={related.id} course={related} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}

/* ── Caso video-unico: video + sidebar CAPITOLI (seek nel video) ── */
function SingleVideoPlayer({ course, lesson, poster, userId, initialProgressSeconds, initialCompleted, onCompleted, belowPlayer }: {
  course: Props['course']
  lesson: LessonFull
  poster?: string | null
  userId: string
  initialProgressSeconds: number
  initialCompleted: boolean
  onCompleted: () => void
  belowPlayer?: React.ReactNode
}) {
  const supabase = createClient()
  const playerRef = useRef<GatedVideoHandle>(null)
  const [src, setSrc] = useState<string | null>(null)
  const [isEmbed, setIsEmbed] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [maxWatched, setMaxWatched] = useState(initialProgressSeconds)
  const [completed, setCompleted] = useState(initialCompleted)
  const chapters = lesson.chapters ?? []

  useEffect(() => {
    const raw = lesson.video_url
    if (!raw) return
    const embed = /youtube\.com|youtu\.be|vimeo\.com/.test(raw)
    setIsEmbed(embed)
    let cancelled = false
    if (embed) setSrc(getMediaUrl(raw))
    else getProtectedMediaUrl(supabase, raw).then((url) => !cancelled && setSrc(url))
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.video_url])

  const watchedPct = completed ? 100 : duration > 0 ? Math.min(100, Math.round((maxWatched / duration) * 100)) : 0

  return (
    <>
      <div className="min-w-0 lg:col-span-2">
        <h3 className="text-white mb-6 leading-tight">{course.title}</h3>

        <div className="aspect-video bg-surface-elevated rounded-none md:rounded-[30px] overflow-hidden relative">
          {isEmbed && src ? (
            <iframe src={src} title={course.title} className="absolute inset-0 w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          ) : src ? (
            <GatedVideo
              ref={playerRef}
              src={src}
              poster={poster}
              lessonId={lesson.id}
              courseId={course.id}
              userId={userId}
              initialMaxWatched={initialProgressSeconds}
              initialCompleted={initialCompleted}
              onProgress={(t, d) => { setCurrentTime(t); setDuration(d); setMaxWatched((m) => Math.max(m, t)) }}
              onCompleted={() => { setCompleted(true); onCompleted() }}
              className="absolute inset-0 w-full h-full bg-black"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/30 text-sm">Caricamento video…</div>
          )}
        </div>

        {course.issues_certificate && !completed && !isEmbed && (
          <p className="mt-3 text-sm text-muted flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0" />
            Per ottenere l&apos;attestato guarda il video fino alla fine: alla prima visione non puoi saltare in avanti (puoi riavvolgere e accelerare).
          </p>
        )}

        {belowPlayer}
      </div>

      <div className="lg:col-span-1">
        <div className="rounded-[40px] bg-card p-6 sticky top-24">
          <div className="flex items-center gap-2 mb-4">
            <ListVideo className="w-5 h-5 text-white" />
            <h6 className="text-white leading-none" style={{ fontSize: '22px' }}>Capitoli</h6>
          </div>
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-muted">{completed ? 'Completato' : 'Avanzamento'}</span>
              <span className="text-white tabular-nums">{watchedPct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-border overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${watchedPct}%` }} />
            </div>
          </div>
          <ChapterList chapters={chapters} currentTime={currentTime} maxWatched={maxWatched} completed={completed} onSeek={(s) => playerRef.current?.seekTo(s)} />
          {completed && (
            <div className="mt-5 flex items-center gap-2 text-sm text-white">
              <CheckCircle2 className="w-4 h-4 fill-white text-black" />
              Video completato — seek libero
            </div>
          )}
        </div>
      </div>
    </>
  )
}

/* ── Caso a moduli: lezione attiva inline + sidebar MODULI (cambia video senza navigare) ── */
function ModulesPlayer({ course, modules, allLessons, userId, poster, progress, onLessonCompleted, belowPlayer }: {
  course: Props['course']
  modules: (Module & { lessons: LessonFull[] })[]
  allLessons: LessonFull[]
  userId: string
  poster?: string | null
  progress: Record<string, { completed: boolean; progress_seconds: number }>
  onLessonCompleted: (lessonId: string) => void
  belowPlayer?: React.ReactNode
}) {
  // Lezione attiva: prima non completata, altrimenti la prima
  const firstIncomplete = allLessons.find((l) => !progress[l.id]?.completed) ?? allLessons[0]
  const [activeId, setActiveId] = useState<string | undefined>(firstIncomplete?.id)
  const active = allLessons.find((l) => l.id === activeId) ?? allLessons[0]

  // Punto di ripresa visto in questa sessione (ref → nessun re-render per-tick):
  // cambiando lezione e tornando indietro, il video riprende da dove eri.
  const watchedRef = useRef<Record<string, number>>({})

  const totalLessons = allLessons.length
  const completedLessons = allLessons.filter((l) => progress[l.id]?.completed).length
  const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  if (!active) return null

  const goToNext = () => {
    const idx = allLessons.findIndex((l) => l.id === active.id)
    const next = allLessons[idx + 1]
    if (next) setActiveId(next.id)
  }

  return (
    <>
      <div className="min-w-0 lg:col-span-2">
        <h3 className="text-white mb-6 leading-tight">{course.title}</h3>

        <LessonContent
          key={active.id}
          lesson={active}
          courseId={course.id}
          userId={userId}
          poster={poster}
          initialCompleted={progress[active.id]?.completed ?? false}
          initialProgressSeconds={watchedRef.current[active.id] ?? progress[active.id]?.progress_seconds ?? 0}
          onProgressSeconds={(s) => { watchedRef.current[active.id] = s }}
          onCompleted={() => { onLessonCompleted(active.id); goToNext() }}
        />

        {belowPlayer}
      </div>

      {/* Sidebar MODULI */}
      <div className="lg:col-span-1">
        <div className="rounded-[40px] bg-card p-6 sticky top-24">
          <div className="flex items-center gap-2 mb-4">
            <ListVideo className="w-5 h-5 text-white" />
            <h6 className="text-white leading-none" style={{ fontSize: '22px' }}>Contenuti del corso</h6>
          </div>

          <div className="mb-5">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-muted">{completedLessons}/{totalLessons} completate</span>
              <span className="text-white tabular-nums">{progressPct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-border overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          <div className="space-y-4">
            {modules.map((module) => (
              <div key={module.id}>
                <p className="text-xs uppercase tracking-wide text-white/40 mb-1.5">{module.title}</p>
                <ul className="space-y-0.5 -mx-2">
                  {(module.lessons ?? []).sort((a, b) => a.sort_order - b.sort_order).map((lesson) => {
                    const isActive = lesson.id === active.id
                    const isDone = progress[lesson.id]?.completed ?? false
                    const Icon = LESSON_ICON[lesson.type] ?? Play
                    return (
                      <li key={lesson.id}>
                        <button
                          onClick={() => setActiveId(lesson.id)}
                          className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-[10px] text-left transition-colors ${
                            isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <span className="shrink-0">
                            {isDone ? <CheckCircle2 className="w-4 h-4 fill-white text-black" /> : <Icon className={`w-4 h-4 ${isActive ? 'fill-current' : ''}`} />}
                          </span>
                          <span className="flex-1 text-sm leading-snug line-clamp-2">{lesson.title}</span>
                          {lesson.duration_seconds ? (
                            <span className="shrink-0 text-xs tabular-nums text-muted">{formatSeconds(lesson.duration_seconds)}</span>
                          ) : null}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
