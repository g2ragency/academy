import Link from 'next/link'
import CourseTypeIcon from '@/components/icons/CourseTypeIcon'
import type { CourseType } from '@/types'
import { COURSE_TYPE_LABELS } from '@/types'

// Nuvola di chip come nel design: le tipologie ripetute su quattro righe
const CHIP_ROWS: CourseType[][] = [
  ['webinar', 'masterclass', 'fast_focus', 'short_master', 'executive_master'],
  ['masterclass', 'executive_master', 'fast_focus', 'webinar'],
  ['executive_master', 'masterclass', 'webinar', 'fast_focus', 'short_master'],
  ['webinar', 'executive_master', 'masterclass', 'fast_focus'],
]

export default function CourseTypes() {
  return (
    <>
      {/* Nuvola di chip: solo da md in su (il Figma mobile omette questa
          sezione, passando da "I nostri docenti" direttamente alle FAQ) */}
      <section className="hidden md:block bg-surface">
        <div className="section-divider" />
        <div className="container-wide py-16">
          <h3 className="text-white text-center mb-14">I nostri corsi</h3>

          <div className="space-y-4">
            {CHIP_ROWS.map((row, rowIndex) => (
              <div key={rowIndex} className="flex flex-wrap justify-center gap-4">
                {row.map((type, i) => (
                  <Link
                    key={`${type}-${i}`}
                    href={`/corsi?tipo=${type}`}
                    className="flex items-center gap-3 pl-2.5 pr-6 h-[60px] rounded-[15px] bg-card text-muted text-lg md:text-[22px] hover:bg-card-hover hover:text-white transition-colors"
                  >
                    <span className="w-9 h-9 rounded-lg bg-surface-elevated flex items-center justify-center shrink-0">
                      <CourseTypeIcon type={type} className="w-[18px] h-[18px]" />
                    </span>
                    {COURSE_TYPE_LABELS[type]}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video di presentazione (Figma 1069×600 ≈ 16:9, responsive) */}
      <section className="bg-surface">
        <div className="section-divider" />
        <div className="container-wide py-16">
          <div className="mx-auto w-full max-w-[1069px] aspect-video rounded-[20px] bg-card" />
        </div>
      </section>
    </>
  )
}
