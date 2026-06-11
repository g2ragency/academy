import Link from 'next/link'
import { Zap, Globe, BookOpen, Award, GraduationCap } from 'lucide-react'
import type { CourseType } from '@/types'
import { COURSE_TYPE_LABELS } from '@/types'

const TYPE_CONFIG: Record<CourseType, { icon: React.ElementType; description: string }> = {
  webinar: {
    icon: Globe,
    description: 'Sessioni live con esperti del settore su temi specifici e aggiornamenti normativi.',
  },
  masterclass: {
    icon: BookOpen,
    description: 'Corsi approfonditi con casi pratici e materiali esclusivi per professionisti.',
  },
  fast_focus: {
    icon: Zap,
    description: 'Pillole formative da 30-60 minuti su temi urgenti e di immediata applicazione.',
  },
  short_master: {
    icon: Award,
    description: 'Percorsi strutturati su aree specifiche della gestione holding, in pochi incontri.',
  },
  executive_master: {
    icon: GraduationCap,
    description: 'Il programma più completo per dirigenti e CDA di gruppi holding strutturati.',
  },
}

export default function CourseTypes() {
  return (
    <section className="py-20 bg-surface">
      <div className="container-wide">
        <div className="text-center mb-12">
          <h2 className="font-bold text-white mb-3">I nostri corsi</h2>
          <p className="text-white/50 max-w-xl mx-auto">
            Cinque format pensati per ogni esigenza formativa, dal rapido aggiornamento al percorso executive completo.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {(Object.keys(TYPE_CONFIG) as CourseType[]).map((type) => (
            <Link
              key={type}
              href={`/corsi?tipo=${type}`}
              className="flex items-center gap-2 px-4 py-2.5 bg-surface-card border border-surface-border rounded-full text-sm text-white/70 hover:text-white hover:border-white/20 transition-all"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-brand" />
              {COURSE_TYPE_LABELS[type]}
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Object.entries(TYPE_CONFIG) as [CourseType, typeof TYPE_CONFIG[CourseType]][]).slice(0, 3).map(([type, config]) => {
            const Icon = config.icon
            return (
              <Link
                key={type}
                href={`/corsi?tipo=${type}`}
                className="card p-6 hover:border-brand/20 transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center mb-4 group-hover:bg-brand/20 transition-colors">
                  <Icon className="w-5 h-5 text-brand" />
                </div>
                <h3 className="font-semibold text-white mb-2">{COURSE_TYPE_LABELS[type]}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{config.description}</p>
              </Link>
            )
          })}
        </div>

        {/* Video placeholder */}
        <div className="mt-8 aspect-video max-w-3xl mx-auto bg-surface-card border border-surface-border rounded-2xl flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center mx-auto mb-3">
              <div className="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[18px] border-l-brand ml-1" />
            </div>
            <p className="text-white/40 text-sm">Video di presentazione</p>
          </div>
        </div>
      </div>
    </section>
  )
}
