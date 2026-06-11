import { createServerClient } from '@/lib/supabase/server'
import CourseCard from '@/components/courses/CourseCard'
import { COURSE_TYPE_LABELS, type CourseType } from '@/types'
import { Search } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Corsi' }

const COURSE_TYPES = Object.entries(COURSE_TYPE_LABELS) as [CourseType, string][]

interface Props {
  searchParams: { tipo?: string; livello?: string; q?: string }
}

async function getCourses(searchParams: Props['searchParams']) {
  const supabase = createServerClient()
  let query = supabase
    .from('courses')
    .select('*, instructor:instructors(*)')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })

  if (searchParams.tipo) query = query.eq('type', searchParams.tipo)
  if (searchParams.livello) query = query.eq('level', searchParams.livello)
  if (searchParams.q) query = query.ilike('title', `%${searchParams.q}%`)

  const { data } = await query
  return data ?? []
}

export default async function CorsiPage({ searchParams }: Props) {
  const courses = await getCourses(searchParams)
  const activeTipo = searchParams.tipo

  return (
    <div className="min-h-screen bg-surface pt-24 pb-20">
      <div className="container-wide">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-bold text-white mb-3">Tutti i corsi</h1>
          <p className="text-white/50">
            {courses.length} corso{courses.length !== 1 ? 'i' : ''} disponibil{courses.length !== 1 ? 'i' : 'e'}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filters */}
          <aside className="lg:w-56 shrink-0">
            <div className="sticky top-24 space-y-6">
              {/* Search */}
              <form method="get">
                {activeTipo && <input type="hidden" name="tipo" value={activeTipo} />}
                <div className="relative">
                  <input
                    name="q"
                    defaultValue={searchParams.q}
                    placeholder="Cerca corsi..."
                    className="input pl-9 text-sm"
                  />
                  <Search className="absolute left-3 top-3.5 w-4 h-4 text-white/30" />
                </div>
              </form>

              {/* Type filter */}
              <div>
                <h3 className="font-semibold text-white/40 uppercase tracking-widest mb-3">Tipo</h3>
                <div className="space-y-1">
                  <a href="/corsi" className={`block px-3 py-2 rounded-lg text-sm transition-colors ${!activeTipo ? 'bg-brand/15 text-white font-medium' : 'text-white/60 hover:text-white hover:bg-surface-elevated'}`}>
                    Tutti
                  </a>
                  {COURSE_TYPES.map(([type, label]) => (
                    <a
                      key={type}
                      href={`/corsi?tipo=${type}`}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${activeTipo === type ? 'bg-brand/15 text-white font-medium' : 'text-white/60 hover:text-white hover:bg-surface-elevated'}`}
                    >
                      {label}
                    </a>
                  ))}
                </div>
              </div>

              {/* Level filter */}
              <div>
                <h3 className="font-semibold text-white/40 uppercase tracking-widest mb-3">Livello</h3>
                <div className="space-y-1">
                  {(['base', 'intermedio', 'avanzato'] as const).map((level) => (
                    <a
                      key={level}
                      href={`/corsi?livello=${level}${activeTipo ? `&tipo=${activeTipo}` : ''}`}
                      className={`block px-3 py-2 rounded-lg text-sm capitalize transition-colors ${searchParams.livello === level ? 'bg-brand/15 text-white font-medium' : 'text-white/60 hover:text-white hover:bg-surface-elevated'}`}
                    >
                      {level}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Course grid */}
          <div className="flex-1">
            {courses.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-white/30 text-lg mb-2">Nessun corso trovato</p>
                <a href="/corsi" className="text-brand text-sm hover:underline">Rimuovi i filtri</a>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
