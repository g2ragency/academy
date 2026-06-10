'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const FAQ_SECTIONS = [
  {
    title: 'Generali',
    items: [
      {
        q: "Cos'è Academy?",
        a: 'Academy è la piattaforma di e-learning dedicata esclusivamente al network delle Holding italiane. Offriamo corsi di alta formazione su governance, fiscalità, compliance e molto altro, tenuti dai massimi esperti del settore.',
      },
      {
        q: "Cosa includono i corsi nella Membership?",
        a: "Con la Membership ottieni accesso illimitato a tutti i corsi disponibili in piattaforma, inclusi Webinar, Masterclass, Fast Focus e Short Master. I contenuti Executive Master possono richiedere un accesso separato.",
      },
      {
        q: 'Dove posso guardare i corsi?',
        a: 'Puoi seguire i corsi da qualsiasi dispositivo connesso a internet: computer, tablet o smartphone. I contenuti sono disponibili 24/7 nella tua area riservata.',
      },
      {
        q: 'Quali corsi sono adatti per me?',
        a: "I corsi sono pensati per dirigenti, manager, consulenti e professionisti che operano nell'ambito delle holding aziendali italiane. Ogni corso specifica il livello di preparazione consigliato.",
      },
      {
        q: 'I corsi sono scaricabili?',
        a: 'I materiali allegati (PDF, slide, dispense) sono scaricabili. I video sono disponibili in streaming dalla piattaforma.',
      },
    ],
  },
  {
    title: 'Pricing e Pagamenti',
    items: [
      {
        q: 'Quanto costa Academy a mese?',
        a: 'Academy offre piani flessibili mensili e annuali. Il piano annuale garantisce un risparmio significativo rispetto al mensile. Visita la pagina prezzi per i dettagli aggiornati.',
      },
      {
        q: 'Come funziona la prova gratuita di 30 giorni?',
        a: "Puoi accedere gratuitamente per 30 giorni senza inserire dati di pagamento. Al termine del periodo di prova potrai scegliere se attivare un abbonamento.",
      },
      {
        q: 'Come cancello l\'iscrizione o l\'abbonamento?',
        a: "Puoi cancellare l'abbonamento in qualsiasi momento dalla tua area riservata, sezione Profilo > Abbonamento. La cancellazione è effettiva al termine del periodo già pagato.",
      },
      {
        q: 'Posso fare pagamenti rateizzati?',
        a: 'Sì, per alcuni corsi e pacchetti è disponibile la rateizzazione. Contattaci per saperne di più.',
      },
      {
        q: 'Ho bisogno di una carta di debito?',
        a: 'Accettiamo tutte le principali carte di credito e debito (Visa, Mastercard, American Express) tramite Stripe, la piattaforma di pagamenti più sicura al mondo.',
      },
    ],
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-surface-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface-elevated transition-colors"
      >
        <span className="text-sm font-medium text-white/80">{q}</span>
        <ChevronDown className={cn('w-4 h-4 text-white/40 shrink-0 ml-4 transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm text-white/50 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  )
}

export default function FAQ() {
  return (
    <section className="py-20 bg-surface-card">
      <div className="container-wide">
        <h2 className="text-2xl lg:text-3xl font-bold text-white text-center mb-12">FAQ</h2>

        <div className="max-w-3xl mx-auto space-y-8">
          {FAQ_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-4">
                {section.title}
              </h3>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <FAQItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
