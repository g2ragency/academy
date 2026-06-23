import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronDown, Linkedin, User } from 'lucide-react'
import ExpandableText from '@/components/ui/ExpandableText'
import { createServerClient } from '@/lib/supabase/server'
import { getMediaUrl } from '@/lib/media'
import InstructorCoursesGrid from './InstructorCoursesGrid'
import CourseRowCard from '@/components/courses/CourseRowCard'
import FollowButton from '@/components/instructors/FollowButton'
import type { Course } from '@/types'

interface Props { params: { slug: string } }

export const dynamic = 'force-dynamic'

export default async function InstructorPage({ params }: Props) {
  const supabase = createServerClient()

  const { data: instructor } = await supabase
    .from('instructors')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (!instructor) notFound()

  // Utente corrente (per stato follow)
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  // I corsi del docente passano dalla junction course_instructors (multi-relatore);
  // il backfill della 008 copre anche i corsi creati col solo instructor_id.
  const { data: courseLinks } = await supabase
    .from('course_instructors')
    .select('course_id')
    .eq('instructor_id', instructor.id)
  const ownCourseIds = (courseLinks ?? []).map((r) => r.course_id as string)

  const [{ data: courses }, { data: popularity }, followResult] = await Promise.all([
    ownCourseIds.length > 0
      ? supabase
          .from('courses')
          .select('*')
          .in('id', ownCourseIds)
          .eq('status', 'published')
          .order('sort_order')
      : Promise.resolve({ data: [] as Course[] }),
    supabase
      .from('course_popularity')
      .select('course_id, enrollment_count')
      .order('enrollment_count', { ascending: false })
      .limit(20),
    user
      ? supabase
          .from('instructor_follows')
          .select('notify')
          .eq('user_id', user.id)
          .eq('instructor_id', instructor.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const isFollowing = !!followResult.data
  const isNotifying = followResult.data?.notify ?? false

  // "Gli altri utenti hanno seguito anche": top per iscrizioni, esclusi i corsi
  // del docente corrente; fallback sui corsi in evidenza se non ci sono iscrizioni.
  const popularIds = (popularity ?? []).map((p) => p.course_id)
  let otherCourses: Course[] = []
  if (popularIds.length > 0) {
    const { data } = await supabase
      .from('courses')
      .select('*')
      .in('id', popularIds)
      .eq('status', 'published')
    const rank = new Map(popularIds.map((id, i) => [id, i]))
    otherCourses = ((data ?? []) as Course[])
      .filter((c) => !ownCourseIds.includes(c.id))
      .sort((a, b) => (rank.get(a.id) ?? 99) - (rank.get(b.id) ?? 99))
      .slice(0, 4)
  }
  if (otherCourses.length === 0) {
    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('status', 'published')
      .eq('featured', true)
      .order('sort_order')
      .limit(8)
    otherCourses = ((data ?? []) as Course[]).filter((c) => !ownCourseIds.includes(c.id)).slice(0, 4)
  }

  const avatar = getMediaUrl(instructor.avatar_url)

  return (
    <div className="min-h-screen bg-surface pt-24 pb-20">
      <div className="container-wide">
        {/* Header: avatar | colonna destra (nome → titolo → pulsanti su mobile;
            nome + pulsanti sulla stessa riga su desktop) */}
        <div className="flex items-start sm:items-center gap-4 sm:gap-5">
          {/* Avatar: scala con il viewport, ~108px mobile → ~180px desktop */}
          <div className="w-[clamp(108px,76px+8.12vw,180px)] h-[clamp(108px,76px+8.12vw,180px)] rounded-full overflow-hidden relative bg-surface-elevated border border-surface-border shrink-0">
            {avatar ? (
              <Image src={avatar} alt={instructor.full_name} fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <User className="w-8 sm:w-10 h-8 sm:h-10 text-white/20" />
              </div>
            )}
          </div>

          {/* Colonna destra: su mobile flex-col (nome → titolo → pulsanti),
              su desktop flex-row (nome a sx, LinkedIn + pulsanti a destra) */}
          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h5 className="text-white text-[18px] leading-[22px] sm:text-[32px] sm:leading-[56px]">{instructor.full_name}</h5>
              {instructor.title && <p className="text-[14px] sm:text-[26px] leading-none text-muted mt-0.5 line-clamp-2">{instructor.title}</p>}
            </div>
            {instructor.linkedin_url && (
              <a
                href={instructor.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`LinkedIn di ${instructor.full_name}`}
                className="hidden sm:flex w-10 h-10 rounded-full border border-surface-border text-white/60 hover:text-white hover:border-white/30 transition-colors items-center justify-center shrink-0"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            )}
            <FollowButton
              instructorId={instructor.id}
              instructorSlug={instructor.slug}
              isLoggedIn={isLoggedIn}
              initialFollowing={isFollowing}
              initialNotify={isNotifying}
            />
          </div>
        </div>

        {/* Informazioni */}
        {instructor.bio && (
          <section className="mt-10">
            <div className="border-t border-muted mb-10" />
            <h5 className="text-white leading-none mb-6" style={{ fontSize: 'clamp(1.125rem, 0.737rem + 1.579vw, 2rem)' }}>Informazioni</h5>
            <ExpandableText
              text={instructor.bio}
              textClassName="text-white/60 text-[14px] sm:text-[24px] leading-[18px] sm:leading-[32px]"
            />
          </section>
        )}

        {/* Corsi del docente — griglia 2×2 con carica di più */}
        <section className="mt-12">
          <div className="border-t border-muted mb-10" />
          <h5 className="text-white leading-none mb-8" style={{ fontSize: 'clamp(1.125rem, 0.737rem + 1.579vw, 2rem)' }}>Corsi</h5>
          {((courses ?? []) as Course[]).length === 0 ? (
            <p className="text-white/40">Nessun corso disponibile al momento.</p>
          ) : (
            <InstructorCoursesGrid courses={(courses ?? []) as Course[]} />
          )}
        </section>

        {/* Gli altri utenti hanno seguito anche */}
        {otherCourses.length > 0 && (
          <section className="mt-16">
            <div className="border-t border-muted mb-12" />
            <h5 className="text-white leading-none mb-8" style={{ fontSize: 'clamp(1.125rem, 0.737rem + 1.579vw, 2rem)' }}>Gli altri utenti hanno seguito anche</h5>
            <div className="space-y-2.5 sm:space-y-5">
              {otherCourses.map((course) => (
                <CourseRowCard key={course.id} course={course} />
              ))}
            </div>

            <div className="mt-6 md:mt-8">
              <Link
                href="/corsi"
                className="md:hidden block w-full text-center bg-white text-black rounded-[10px] py-3 text-sm"
              >
                Scopri tutti i corsi
              </Link>
              <Link
                href="/corsi"
                className="hidden md:inline-flex w-full items-center justify-center gap-2 text-muted hover:text-white transition-colors"
              >
                Carica di più <ChevronDown className="w-4 h-4" />
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
