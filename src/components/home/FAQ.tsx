'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const FAQ_SECTIONS = [
  {
    title: 'Generali',
    items: [
      {
        q: "Cos'è Assoholding Academy?",
        a: 'Assoholding Academy è la piattaforma di e-learning dedicata esclusivamente al network delle Holding italiane. Offriamo corsi di alta formazione su governance, fiscalità, compliance e molto altro, tenuti dai massimi esperti del settore.',
      },
      {
        q: "Cos'è incluso nella Membership?",
        a: 'Con la Membership ottieni accesso illimitato a tutti i corsi disponibili in piattaforma, inclusi Webinar, Masterclass, Fast Focus e Short Master. I contenuti Executive Master possono richiedere un accesso separato.',
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
        q: 'Quanto costa Assoholding Academy a corso?',
        a: 'Ogni corso ha un prezzo indicato nella relativa pagina. Sono disponibili anche piani Membership mensili e annuali con accesso illimitato: il piano annuale garantisce un risparmio significativo.',
      },
      {
        q: 'Come funziona la prova gratuita di 30 giorni?',
        a: 'Puoi accedere gratuitamente per 30 giorni senza inserire dati di pagamento. Al termine del periodo di prova potrai scegliere se attivare un abbonamento.',
      },
      {
        q: 'Come cancello il mio abbonamento?',
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
    <div className="rounded-[15px] bg-[#1B1B1B] backdrop-blur-[15px] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 h-[53px] text-left"
      >
        <span className="text-muted">{q}</span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted shrink-0 ml-4 transition-transform duration-300',
            open && 'rotate-180'
          )}
        />
      </button>
      {/* Apertura/chiusura morbida: la riga grid passa da 0fr a 1fr animando l'altezza */}
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-5 text-muted text-base leading-relaxed">{a}</p>
        </div>
      </div>
    </div>
  )
}

export default function FAQ() {
  return (
    <section className="py-16 bg-surface border-t border-surface-border">
      <div className="container-wide">
        <h3 className="text-white text-center mb-14">FAQ</h3>

        <div className="mx-auto max-w-[1068px] space-y-10">
          {FAQ_SECTIONS.map((section) => (
            <div key={section.title}>
              <h6 className="text-white mb-5">{section.title}</h6>
              <div className="space-y-1.5">
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
