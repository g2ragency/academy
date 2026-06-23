import Link from 'next/link'
import Image from 'next/image'
import { User } from 'lucide-react'
import { getMediaUrl } from '@/lib/media'
import type { Instructor } from '@/types'

/**
 * Card docente condivisa (home "I nostri docenti" + carosello "Relatori" sul
 * corso). Valori Figma: card radius 30, pannello inset 14px, radius 20,
 * sfondo #D9D9D9 61% + blur 4 + drop shadow, padding 14h/8v.
 */
export default function InstructorCard({ instructor }: { instructor: Instructor }) {
  const avatar = getMediaUrl(instructor.avatar_url)

  return (
    <Link
      href={`/docenti/${instructor.slug}`}
      className="group relative block aspect-[148/210] md:aspect-[268/345] rounded-[10px] md:rounded-[30px] overflow-hidden bg-card"
    >
      {avatar ? (
        <Image
          src={avatar}
          alt={instructor.full_name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <User className="w-16 h-16 text-white/10" />
        </div>
      )}

      {/* Riquadro nome + descrizione (Figma: vetro chiaro, titolo per intero) */}
      <div className="absolute inset-x-2.5 bottom-2.5 md:inset-x-[14px] md:bottom-[14px] rounded-[10px] md:rounded-[20px] bg-[#D9D9D9]/[0.61] backdrop-blur-[7.5px] shadow-[0_4px_4px_0_rgba(0,0,0,0.11)] px-3 py-2">
        <h5
          className="text-black leading-[22px] md:leading-[35px]"
          style={{ fontSize: 'clamp(1rem, 0.778rem + 0.902vw, 1.5rem)' }}
        >{instructor.full_name}</h5>
        {instructor.title && (
          <p className="text-black/70 text-[clamp(0.625rem,0.514rem+0.451vw,0.875rem)] leading-none mt-1 line-clamp-4">{instructor.title}</p>
        )}
      </div>
    </Link>
  )
}
