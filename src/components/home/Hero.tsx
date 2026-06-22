'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Check, Sparkles } from 'lucide-react'

const TOPICS = [
  'Sviluppare Best Practices Holding',
  'Aggiornamento Fiscale e PEX',
  'Governance e Family Business',
  'Compliance & Sistemi ESG',
]

export default function Hero() {
  const [selected, setSelected] = useState(2)

  return (
    <section className="relative min-h-screen bg-surface overflow-hidden pt-16">
      {/* Stack di card decorativo (export Figma) sul lato destro */}
      <div className="absolute inset-y-0 right-0 left-[10%] hidden lg:block pointer-events-none select-none">
        <Image
          src="/images/hero-stack.png"
          alt=""
          fill
          priority
          className="object-cover object-right-top"
        />
        {/* Tooltip sul corso in evidenza */}
        <div className="absolute top-[44%] right-[22%] bg-white text-black rounded-lg px-5 py-2.5">
          PEX &amp; Regime dei Dividendi
        </div>
      </div>

      {/* Blur progressivo sullo stack: sfocato a sinistra, nitido verso destra.
          Il backdrop-filter è mascherato con un gradiente che si annulla a destra. */}
      <div
        className="absolute inset-y-0 right-0 left-[10%] hidden lg:block pointer-events-none"
        style={{
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          maskImage: 'linear-gradient(to right, #000 0%, #000 20%, transparent 65%)',
          WebkitMaskImage: 'linear-gradient(to right, #000 0%, #000 20%, transparent 65%)',
        }}
      />

      {/* Sfumatura per leggibilità del testo sopra lo stack */}
      <div className="absolute inset-y-0 left-0 w-3/5 bg-gradient-to-r from-surface via-surface/80 to-transparent pointer-events-none" />

      {/* Layout Figma:
          - mobile: flex column a tutta altezza, titolo+desc in alto e
            quiz+bottone "pinnati" in basso (justify-between)
          - desktop: layout naturale (titolo, desc, quiz, bottone in sequenza)
            con max-w sul testo per non sovrapporsi allo stack di card a destra */}
      <div className="container-wide relative z-10 min-h-[calc(100vh-4rem)] pt-10 pb-8 lg:pt-24 lg:pb-16 flex flex-col justify-between lg:block">
        <div className="lg:max-w-[640px]">
          <h1 className="text-white leading-tight mb-6 lg:mb-12">
            Impara dai migliori,
            <br />
            dai il meglio di te.
          </h1>

          <p className="text-muted lg:mb-14 lg:max-w-[495px]">
            L&apos;autorità formativa dedicata esclusivamente
            <br />
            al network delle Holding italiane.
          </p>
        </div>

        <div className="lg:max-w-[640px]">
          {/* Selettore argomenti */}
          <div className="flex items-center gap-3 mb-4 lg:mb-6">
            <span className="w-0.5 h-6 bg-[#60FDE8] shrink-0" />
            <h6 className="text-white">Cosa ti porta oggi in Academy?</h6>
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
                className={`w-full flex items-center gap-4 px-4 h-[53px] rounded-[15px] text-left backdrop-blur-[15px] transition-colors duration-200 ${
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
            className="flex items-center justify-center w-full lg:w-[225px] h-[53px] lg:h-[65px] bg-white text-black rounded-[15px] backdrop-blur-[15px] hover:bg-white/80 transition-colors"
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
