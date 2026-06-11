import Link from 'next/link'
import { GraduationCap, Presentation, ShieldCheck, Zap, Briefcase } from 'lucide-react'
import type { CourseType } from '@/types'
import { COURSE_TYPE_LABELS } from '@/types'

const TYPE_ICONS: Record<CourseType, React.ElementType> = {
  webinar: Presentation,
  masterclass: GraduationCap,
  fast_focus: Zap,
  short_master: Briefcase,
  executive_master: ShieldCheck,
}

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
      <section className="py-16 bg-surface border-t border-surface-border">
        <div className="container-wide">
          <h3 className="text-white text-center mb-14">I nostri corsi</h3>

          <div className="space-y-4">
            {CHIP_ROWS.map((row, rowIndex) => (
              <div key={rowIndex} className="flex flex-wrap justify-center gap-4">
                {row.map((type, i) => {
                  const Icon = TYPE_ICONS[type]
                  return (
                    <Link
                      key={`${type}-${i}`}
                      href={`/corsi?tipo=${type}`}
                      className="flex items-center gap-3 pl-2.5 pr-6 h-[60px] rounded-xl bg-surface-card text-white hover:bg-surface-elevated transition-colors"
                    >
                      <span className="w-9 h-9 rounded-lg bg-surface-elevated flex items-center justify-center">
                        <Icon className="w-[18px] h-[18px]" />
                      </span>
                      {COURSE_TYPE_LABELS[type]}
                    </Link>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video di presentazione */}
      <section className="py-16 bg-surface border-t border-surface-border">
        <div className="container-wide">
          <div className="mx-auto max-w-[1069px] h-[600px] rounded-3xl bg-surface-card" />
        </div>
      </section>
    </>
  )
}
