import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { User } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { getMediaUrl } from '@/lib/media'
import type { Instructor } from '@/types'

export const dynamic = 'force-dynamic'

export default async function DocentiPreferiti() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: follows } = await supabase
    .from('instructor_follows')
    .select('notify, created_at, instructors(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  type FollowRow = { notify: boolean; created_at: string; instructors: Instructor | null }
  const items = ((follows ?? []) as unknown as FollowRow[]).filter((f) => f.instructors !== null)

  return (
    <div className="px-10 py-8">
      <h4 className="text-white mb-8">Docenti preferiti</h4>

      {items.length === 0 ? (
        <p className="text-muted">
          Non stai ancora seguendo nessun docente.{' '}
          <Link href="/docenti" className="text-white underline underline-offset-4">
            Esplora i docenti
          </Link>
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {items.map(({ instructors: instructor, notify }) => {
            const avatar = getMediaUrl(instructor!.avatar_url)
            return (
              <Link
                key={instructor!.id}
                href={`/docenti/${instructor!.slug}`}
                className="flex flex-col items-center text-center gap-3 p-5 rounded-[20px] bg-[#1B1B1B] hover:bg-[#222] transition-colors"
              >
                <div className="w-20 h-20 rounded-full overflow-hidden relative bg-surface-elevated border border-surface-border shrink-0">
                  {avatar ? (
                    <Image
                      src={avatar}
                      alt={instructor!.full_name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <User className="w-8 h-8 text-white/20" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-white leading-snug">{instructor!.full_name}</p>
                  {instructor!.title && (
                    <p className="text-sm text-muted mt-1 line-clamp-2 leading-snug">{instructor!.title}</p>
                  )}
                  {notify && (
                    <span className="inline-block text-xs text-muted mt-2 opacity-60">Notifiche attive</span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
