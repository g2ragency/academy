'use client'

import { useMemo } from 'react'
import { Play, Lock } from 'lucide-react'
import { formatSeconds } from '@/lib/utils'
import type { LessonChapter } from '@/types'

interface Props {
  chapters: LessonChapter[]
  /** posizione corrente del video (per evidenziare il capitolo attivo) */
  currentTime: number
  /** secondo massimo visto (per bloccare i capitoli non ancora raggiunti) */
  maxWatched: number
  /** video già completato: seek libero, nessun lucchetto */
  completed: boolean
  onSeek: (seconds: number) => void
}

/** Lista dei capitoli di un video: click → seek, con evidenza del capitolo
 *  attivo e lucchetto su quelli non ancora sbloccati (gating). */
export default function ChapterList({ chapters, currentTime, maxWatched, completed, onSeek }: Props) {
  const sorted = useMemo(
    () => [...chapters].sort((a, b) => a.start_seconds - b.start_seconds),
    [chapters],
  )
  const activeIndex = useMemo(() => {
    let idx = -1
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].start_seconds <= currentTime + 0.4) idx = i
      else break
    }
    return idx
  }, [sorted, currentTime])

  if (sorted.length === 0) return <p className="text-sm text-muted">Nessun capitolo per questo video.</p>

  return (
    <ul className="space-y-1 -mx-2">
      {sorted.map((ch, i) => {
        const isActive = i === activeIndex
        const locked = !completed && ch.start_seconds > maxWatched + 1
        return (
          <li key={ch.id}>
            <button
              onClick={() => onSeek(ch.start_seconds)}
              disabled={locked}
              className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-[10px] text-left transition-colors ${
                isActive
                  ? 'bg-white/10 text-white'
                  : locked
                    ? 'text-white/30'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="shrink-0">
                {locked ? <Lock className="w-4 h-4" /> : <Play className={`w-4 h-4 ${isActive ? 'fill-current' : ''}`} />}
              </span>
              <span className="flex-1 text-sm leading-snug">{ch.title}</span>
              <span className="shrink-0 text-xs tabular-nums text-muted">{formatSeconds(ch.start_seconds)}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
