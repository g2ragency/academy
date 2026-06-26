'use client'

import Link from 'next/link'
import FormatIcon from '@/components/icons/FormatIcon'
import { useFormats } from '@/context/FormatsContext'

export default function CourseTypes() {
  const formats = useFormats()
  // Nuvola di chip come nel design: i formati ripetuti su quattro righe sfalsate
  const rows = formats.length
    ? [0, 2, 4, 1].map((off) => formats.map((_, i) => formats[(i + off) % formats.length]))
    : []

  return (
    <>
      {/* Nuvola di chip: solo da md in su (il Figma mobile omette questa
          sezione, passando da "I nostri docenti" direttamente alle FAQ) */}
      <section className="hidden md:block bg-surface">
        <div className="section-divider" />
        <div className="container-wide py-16">
          <h3 className="text-white md:text-center mb-14">I nostri corsi</h3>

          <div className="space-y-4">
            {rows.map((row, rowIndex) => (
              <div key={rowIndex} className="flex flex-wrap justify-center gap-[14px]">
                {row.map((f, i) => (
                  <Link
                    key={`${f.slug}-${i}`}
                    href={`/corsi?tipo=${f.slug}`}
                    className="flex items-center gap-3 py-[17px] pl-[17px] pr-9 rounded-[15px] bg-card backdrop-blur-[20px] text-muted text-[22px] leading-none hover:bg-card-hover hover:text-white transition-colors"
                  >
                    <span className="w-9 h-9 rounded-lg bg-surface-elevated flex items-center justify-center shrink-0">
                      <FormatIcon slug={f.slug} iconUrl={f.icon_url} className="w-[18px] h-[18px]" />
                    </span>
                    {f.name}
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
