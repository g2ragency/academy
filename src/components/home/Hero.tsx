'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Sparkles } from 'lucide-react'
import HeroCardStack, { type HeroCourse } from './HeroCardStack'

const TOPICS = [
  'Sviluppare Best Practices Holding',
  'Aggiornamento Fiscale e PEX',
  'Governance e Family Business',
  'Compliance & Sistemi ESG',
]

export default function Hero({ courses }: { courses: HeroCourse[] }) {
  const [selected, setSelected] = useState(2)

  return (
    <section className="relative min-h-screen bg-surface overflow-hidden pt-16">
      {/* Stack di card 3D animato sul lato destro (desktop) */}
      <div className="absolute top-0 bottom-0 right-0 left-[14%] hidden lg:block">
        <HeroCardStack courses={courses} />
      </div>

      {/* Nero pieno: si interrompe presto (solo vicino al testo) */}
      <div
        className="absolute inset-y-0 left-0 w-2/3 bg-surface pointer-events-none z-[1]"
        style={{
          maskImage: 'linear-gradient(to right, #000 0%, #000 25%, transparent 60%)',
          WebkitMaskImage: 'linear-gradient(to right, #000 0%, #000 25%, transparent 60%)',
        }}
      />
      {/* Blur: si estende molto più a destra, oltre il nero, sfumando sulle card */}
      <div
        className="absolute inset-y-0 left-0 w-2/3 backdrop-blur-[10px] pointer-events-none z-[1]"
        style={{
          maskImage: 'linear-gradient(to right, #000 0%, #000 25%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, #000 0%, #000 25%, transparent 100%)',
        }}
      />

      {/* Sfumatura sul bordo inferiore (Figma: full width, h ~87px): le card che
          escono sotto svaniscono nel nero */}
      <div className="absolute inset-x-0 bottom-0 h-[87px] bg-gradient-to-t from-surface to-transparent pointer-events-none z-[1]" />

      {/* Layout Figma:
          - mobile: flex column a tutta altezza, titolo+desc in alto e
            quiz+bottone "pinnati" in basso (justify-between)
          - desktop: layout naturale (titolo, desc, quiz, bottone in sequenza)
            con max-w sul testo per non sovrapporsi allo stack di card a destra */}
      <div className="container-wide relative z-10 min-h-[calc(100vh-4rem)] pt-10 pb-8 lg:pt-24 lg:pb-16 flex flex-col justify-between lg:block pointer-events-none">
        <div className="lg:max-w-[640px]">
          <h1 className="text-white mb-6 lg:mb-12">
            Impara dai migliori,
            <br />
            dai il meglio di te.
          </h1>

          <p className="p-hero text-muted lg:mb-14 lg:max-w-[495px]">
            L&apos;autorità formativa dedicata esclusivamente
            <br />
            al network delle Holding italiane.
          </p>
        </div>

        <div className="lg:max-w-[640px] pointer-events-auto">
          {/* Selettore argomenti */}
          <div className="flex items-center gap-3 mb-4 lg:mb-6">
            <span className="w-0.5 h-6 bg-[#60FDE8] shrink-0" />
            <p className="p-hero leading-none text-white">Cosa ti porta oggi in Academy?</p>
          </div>

          <div className="space-y-1.5 mb-4 lg:mb-9 lg:max-w-[525px]">
            {TOPICS.map((topic, i) => (
              <button
                key={topic}
                onClick={() => setSelected(i)}
                style={
                  selected === i
                    ? {
                        background:
                          'radial-gradient(138.67% 252.83% at -6.76% -72.64%, rgba(115, 115, 115, 0.3) 0%, rgba(217, 217, 217, 0.3) 100%)',
                      }
                    : undefined
                }
                className={`w-full flex items-center gap-4 px-4 h-[53px] rounded-[15px] text-left text-[clamp(1rem,0.9446rem+0.2256vw,1.125rem)] leading-none backdrop-blur-[15px] transition-colors duration-200 ${
                  selected === i ? 'text-white' : 'bg-card text-muted hover:text-white'
                }`}
              >
                <span
                  className={`w-[25px] h-[25px] rounded-[7px] flex items-center justify-center shrink-0 ${
                    selected === i ? 'bg-white' : 'bg-surface-elevated'
                  }`}
                >
                  {selected === i && <Check className="w-4 h-4 text-black" strokeWidth={3} />}
                </span>
                {topic}
              </button>
            ))}
          </div>

          {/* Bottone Continua: a tutta larghezza su mobile (Figma),
              225×65 su desktop. */}
          <Link
            href="/corsi"
            className="flex items-center justify-center w-full lg:w-[225px] h-10 lg:h-[65px] bg-white text-black text-[clamp(1rem,0.8338rem+0.677vw,1.375rem)] leading-none rounded-[10px] lg:rounded-[15px] backdrop-blur-[15px] hover:bg-white/80 transition-colors"
          >
            Continua
          </Link>
        </div>
      </div>

      {/* Pill assistente AI (Figma: 290×60, radius 15, blur, gradiente tenue) */}
      <div
        className="absolute bottom-10 right-10 z-10 hidden lg:flex items-center gap-3 h-[60px] px-6 rounded-[15px] border border-surface-border backdrop-blur-[7.5px]"
        style={{
          background:
            'radial-gradient(138.67% 252.83% at -6.76% -72.64%, rgba(115, 115, 115, 0.2) 0%, rgba(217, 217, 217, 0.2) 100%)',
        }}
      >
        <Sparkles className="w-5 h-5 text-white" />
        <span className="text-white">Chiedi all&apos;assistente AI</span>
      </div>
    </section>
  )
}
