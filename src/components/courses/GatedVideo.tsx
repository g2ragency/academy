'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface GatedVideoHandle {
  /** Sposta il video al secondo indicato (rispetta il gating se non completato) */
  seekTo: (seconds: number) => void
}

interface Props {
  /** URL nativo già risolto (signed URL del bucket o file diretto). NON per embed YouTube/Vimeo. */
  src: string
  poster?: string | null
  lessonId: string
  courseId: string
  userId: string
  /** progress_seconds salvato: punto massimo già visto (soffitto del gating + ripresa) */
  initialMaxWatched: number
  /** true = video già completato almeno una volta → seek libero */
  initialCompleted: boolean
  onProgress?: (currentTime: number, duration: number) => void
  onCompleted?: () => void
  className?: string
}

/**
 * Player video con "gating" per l'obbligo di visione (certificati):
 * - prima visione: non si può trascinare la barra IN AVANTI oltre il punto già
 *   visto (`maxWatched`); il rewind e l'accelerazione (playbackRate) restano liberi.
 * - dopo il primo completamento (`completed`): seek libero ovunque.
 * Il progresso (progress_seconds / completed) è salvato in `lesson_progress`.
 *
 * Nota: funziona solo su <video> nativo (file self-hosted / signed URL). Gli
 * embed YouTube/Vimeo non sono controllabili dal browser e non passano di qui.
 */
const GatedVideo = forwardRef<GatedVideoHandle, Props>(function GatedVideo(
  { src, poster, lessonId, courseId, userId, initialMaxWatched, initialCompleted, onProgress, onCompleted, className },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const maxWatched = useRef(initialMaxWatched) // secondo più avanti raggiunto lecitamente
  const completedOnce = useRef(initialCompleted)
  const lastSaved = useRef(initialMaxWatched)
  const supabase = createClient()

  const save = (seconds: number, markCompleted = false) => {
    supabase
      .from('lesson_progress')
      .upsert(
        {
          user_id: userId,
          lesson_id: lessonId,
          course_id: courseId,
          progress_seconds: Math.floor(seconds),
          ...(markCompleted ? { completed: true, completed_at: new Date().toISOString() } : {}),
        },
        { onConflict: 'user_id,lesson_id' },
      )
      .then(() => {})
  }

  useImperativeHandle(ref, () => ({
    seekTo(seconds: number) {
      const v = videoRef.current
      if (!v) return
      // gating: prima del completamento non si salta oltre il massimo visto
      v.currentTime = completedOnce.current ? seconds : Math.min(seconds, maxWatched.current)
      v.play().catch(() => {})
    },
  }), [])

  const handleTimeUpdate = () => {
    const v = videoRef.current
    if (!v) return
    // maxWatched avanza SOLO durante la riproduzione reale (non in pausa, non
    // durante un seek): così trascinare la barra a piccoli passi non "sblocca"
    // avanzamento (prima un seek entro tolleranza faceva creepare maxWatched).
    // Dopo il completamento non serve più (seek libero).
    if (completedOnce.current || (!v.paused && !v.seeking)) {
      if (v.currentTime > maxWatched.current) maxWatched.current = v.currentTime
    }
    onProgress?.(v.currentTime, v.duration || 0)
    if (maxWatched.current - lastSaved.current >= 10) {
      lastSaved.current = maxWatched.current
      save(maxWatched.current)
    }
  }

  // Blocca il trascinamento in avanti prima del completamento (il rewind passa).
  // Reimpostare currentTime a maxWatched non ri-scatena il blocco (non è > soglia) → niente loop.
  // Tolleranza stretta (0.3s) solo per assorbire i micro-aggiustamenti del browser.
  const handleSeeking = () => {
    const v = videoRef.current
    if (!v) return
    if (!completedOnce.current && v.currentTime > maxWatched.current + 0.3) {
      v.currentTime = maxWatched.current
    }
  }

  const handleEnded = () => {
    if (completedOnce.current) return
    completedOnce.current = true
    save(videoRef.current?.duration ?? maxWatched.current, true)
    onCompleted?.()
  }

  // Ripresa dal punto massimo visto + salvataggio all'uscita
  const handleLoadedMetadata = () => {
    const v = videoRef.current
    if (v && initialMaxWatched > 0 && initialMaxWatched < v.duration - 1) {
      v.currentTime = initialMaxWatched
    }
  }

  useEffect(() => {
    const flush = () => {
      if (maxWatched.current > lastSaved.current) save(maxWatched.current)
    }
    window.addEventListener('pagehide', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      flush()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster ?? undefined}
      controls
      controlsList="nodownload"
      // object-contain fisso: garantisce che il fotogramma non venga MAI
      // tagliato (a differenza di cover), a costo di eventuali barre nere
      // se l'aspect ratio del video non è esattamente 16:9.
      className={`object-contain ${className ?? 'w-full h-full'}`}
      onLoadedMetadata={handleLoadedMetadata}
      onTimeUpdate={handleTimeUpdate}
      onSeeking={handleSeeking}
      onEnded={handleEnded}
    />
  )
})

export default GatedVideo
