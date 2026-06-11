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
          className="object-contain object-right-top"
        />
        {/* Tooltip sul corso in evidenza */}
        <div className="absolute top-[44%] right-[22%] bg-white text-black rounded-lg px-5 py-2.5">
          PEX &amp; Regime dei Dividendi
        </div>
      </div>

      {/* Sfumatura per leggibilità del testo sopra lo stack */}
      <div className="absolute inset-y-0 left-0 w-3/5 bg-gradient-to-r from-surface via-surface/80 to-transparent pointer-events-none" />

      <div className="container-wide relative z-10 pt-24 pb-16">
        <div className="max-w-[640px]">
          <h1 className="text-white leading-tight mb-12">
            Impara dai migliori,
            <br />
            dai il meglio di te.
          </h1>

          <p className="text-muted mb-14 max-w-[495px]">
            L&apos;autorità formativa dedicata esclusivamente
            <br />
            al network delle Holding italiane.
          </p>

          {/* Selettore argomenti */}
          <div className="flex items-center gap-3 mb-6">
            <span className="w-0.5 h-6 bg-white shrink-0" />
            <h6 className="text-white">Cosa ti porta oggi in Academy?</h6>
          </div>

          <div className="space-y-1.5 mb-9 max-w-[525px]">
            {TOPICS.map((topic, i) => (
              <button
                key={topic}
                onClick={() => setSelected(i)}
                className={`w-full flex items-center gap-4 px-4 h-[53px] rounded-xl text-left transition-colors duration-200 ${
                  selected === i
                    ? 'bg-surface-elevated text-white'
                    : 'bg-surface-card text-muted hover:text-white'
                }`}
              >
                <span
                  className={`w-[25px] h-[25px] rounded-md flex items-center justify-center shrink-0 ${
                    selected === i ? 'bg-white' : 'bg-surface-elevated'
                  }`}
                >
                  {selected === i && <Check className="w-4 h-4 text-black" strokeWidth={3} />}
                </span>
                {topic}
              </button>
            ))}
          </div>

          <Link
            href="/corsi"
            className="inline-flex items-center justify-center w-[225px] h-[65px] bg-white text-black rounded-xl hover:bg-white/80 transition-colors"
          >
            Continua
          </Link>
        </div>
      </div>

      {/* Pill assistente AI */}
      <div className="absolute bottom-10 right-10 z-10 hidden lg:flex items-center gap-2.5 bg-surface-elevated border border-surface-border rounded-full px-5 py-3 backdrop-blur-sm">
        <Sparkles className="w-4 h-4 text-white" />
        <span className="text-white">Chiedi all&apos;assistente AI</span>
      </div>
    </section>
  )
}
