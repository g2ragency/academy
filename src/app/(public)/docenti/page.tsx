import { createServerClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { User } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Docenti' }

export default async function DocentiPage() {
  const supabase = createServerClient()
  const { data: instructors } = await supabase
    .from('instructors')
    .select('*')
    .order('sort_order')

  return (
    <div className="min-h-screen bg-surface pt-24 pb-20">
      <div className="container-wide">
        <div className="mb-10">
          <h1 className="font-bold text-white mb-3">I nostri docenti</h1>
          <p className="text-white/50">
            L&apos;autorità formativa dedicata al network delle Holding italiane.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {(instructors ?? []).map((instructor) => (
            <Link
              key={instructor.id}
              href={`/docenti/${instructor.slug}`}
              className="card group overflow-hidden hover:border-white/10 transition-all duration-300"
            >
              <div className="aspect-[3/4] relative overflow-hidden bg-surface-elevated">
                {instructor.avatar_url ? (
                  <Image src={instructor.avatar_url} alt={instructor.full_name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <User className="w-16 h-16 text-white/10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="font-semibold text-white text-sm leading-tight">{instructor.full_name}</p>
                  {instructor.title && <p className="text-xs text-white/60 mt-0.5 line-clamp-2">{instructor.title}</p>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
