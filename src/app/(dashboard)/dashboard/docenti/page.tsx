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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map(({ instructors: instructor, notify }) => {
            const avatar = getMediaUrl(instructor!.avatar_url)
            return (
              <Link
                key={instructor!.id}
                href={`/docenti/${instructor!.slug}`}
                className="flex items-center gap-4 p-4 rounded-[20px] bg-[#1B1B1B] transition-colors hover:bg-[#222]"
              >
                <div className="w-14 h-14 rounded-full overflow-hidden relative bg-surface-elevated border border-surface-border shrink-0">
                  {avatar ? (
                    <Image
                      src={avatar}
                      alt={instructor!.full_name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <User className="w-6 h-6 text-white/20" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-white truncate">{instructor!.full_name}</p>
                  {instructor!.title && (
                    <p className="text-sm text-muted truncate mt-0.5">{instructor!.title}</p>
                  )}
                  {notify && (
                    <p className="text-xs text-muted mt-0.5">Notifiche attive</p>
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
