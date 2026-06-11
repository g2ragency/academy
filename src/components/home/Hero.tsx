'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Sparkles } from 'lucide-react'

const TOPICS = [
  'Sviluppare Best Practices Holding',
  'Aggiornamento Fiscale e PEX',
  'Governance & Family Business',
  'Compliance & Sistemi ESG',
]

export default function Hero() {
  const [selected, setSelected] = useState(2)

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-surface via-surface to-surface-card" />
      <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-brand/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-brand/3 rounded-full blur-[100px] pointer-events-none" />

      <div className="container-wide relative z-10 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left content */}
          <div>
            <div className="inline-flex items-center gap-2 bg-brand/10 border border-brand/20 rounded-full px-4 py-1.5 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-brand" />
              <span className="text-xs font-medium text-brand">La formazione per le Holding Italiane</span>
            </div>

            <h1 className="font-bold text-white leading-tight mb-6">
              Impara dai migliori,
              <br />
              <span className="text-brand">dai il meglio</span> di te.
            </h1>

            <p className="text-lg text-white/60 leading-relaxed mb-10 max-w-xl">
              L&apos;autorità formativa dedicata esclusivamente al network delle Holding italiane.
              Accedi a contenuti esclusivi creati dai massimi esperti del settore.
            </p>

            {/* Topic selector */}
            <div className="bg-surface-card border border-surface-border rounded-2xl p-5 mb-8">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">
                Cosa ti porta oggi in Academy?
              </p>
              <div className="space-y-2">
                {TOPICS.map((topic, i) => (
                  <button
                    key={i}
                    onClick={() => setSelected(i)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all duration-200 ${
                      selected === i
                        ? 'bg-brand/15 border border-brand/30 text-white font-medium'
                        : 'text-white/50 hover:text-white/80 hover:bg-surface-elevated border border-transparent'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${selected === i ? 'bg-brand' : 'border border-white/20'}`}>
                      {selected === i && <span className="w-1.5 h-1.5 bg-black rounded-sm" />}
                    </span>
                    {topic}
                  </button>
                ))}
              </div>
              <Link
                href={`/corsi`}
                className="mt-4 w-full btn-primary text-sm py-3 flex items-center justify-center gap-2 rounded-xl"
              >
                Continua <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8">
              {[
                { value: '200+', label: 'Ore di formazione' },
                { value: '50+', label: 'Docenti esperti' },
                { value: '1.000+', label: 'Professionisti formati' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-white/40 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right content - course preview card */}
          <div className="relative hidden lg:block">
            <div className="relative">
              {/* Main card */}
              <div className="card p-6 shadow-2xl">
                <div className="aspect-video bg-surface-elevated rounded-xl mb-4 overflow-hidden relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-brand/20 border border-brand/30 backdrop-blur-sm flex items-center justify-center">
                      <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[14px] border-l-brand ml-1" />
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-xs font-medium text-white/80 truncate">
                      PEX & Regime dei Dividendi
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white text-sm">PEX & Regime dei Dividendi</p>
                    <p className="text-xs text-white/50 mt-0.5">Paolo Neri • 3 ore</p>
                  </div>
                  <span className="badge bg-brand/20 text-brand border-brand/30 text-xs">Masterclass</span>
                </div>
              </div>

              {/* AI bubble */}
              <div className="absolute -top-4 -right-4 bg-brand text-black text-xs font-bold px-3 py-2 rounded-xl shadow-lg flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Chiedi all&apos;assistente AI
              </div>

              {/* Floating cards */}
              <div className="absolute -bottom-6 -left-6 card p-3 shadow-xl flex items-center gap-2 text-xs">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-green-400 font-bold">✓</span>
                </div>
                <div>
                  <p className="font-semibold text-white">Certificato completato</p>
                  <p className="text-white/50">Governance & Family</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
