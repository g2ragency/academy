import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Linkedin, User } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import CourseCard from '@/components/courses/CourseCard'

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

  const [{ data: courses }, { data: popularity }] = await Promise.all([
    supabase
      .from('courses')
      .select('*, instructor:instructors(*)')
      .eq('instructor_id', instructor.id)
      .eq('status', 'published')
      .order('sort_order'),
    supabase
      .from('course_popularity')
      .select('course_id, enrollment_count')
      .order('enrollment_count', { ascending: false })
      .limit(20),
  ])

  // "I corsi più seguiti dagli utenti": top per iscrizioni, esclusi quelli del
  // docente corrente; fallback sui corsi in evidenza se non ci sono iscrizioni.
  const popularIds = (popularity ?? []).map((p) => p.course_id)
  let otherCourses: typeof courses = []
  if (popularIds.length > 0) {
    const { data } = await supabase
      .from('courses')
      .select('*, instructor:instructors(*)')
      .in('id', popularIds)
      .eq('status', 'published')
      .neq('instructor_id', instructor.id)
    const rank = new Map(popularIds.map((id, i) => [id, i]))
    otherCourses = (data ?? []).sort((a, b) => (rank.get(a.id) ?? 99) - (rank.get(b.id) ?? 99)).slice(0, 4)
  }
  if (!otherCourses || otherCourses.length === 0) {
    const { data } = await supabase
      .from('courses')
      .select('*, instructor:instructors(*)')
      .eq('status', 'published')
      .eq('featured', true)
      .neq('instructor_id', instructor.id)
      .order('sort_order')
      .limit(4)
    otherCourses = data ?? []
  }

  return (
    <div className="min-h-screen bg-surface pt-24 pb-20">
      <div className="container-wide">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Instructor profile */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 card p-6 text-center">
              <div className="w-32 h-32 rounded-full overflow-hidden relative mx-auto mb-4 bg-surface-elevated border border-surface-border">
                {instructor.avatar_url ? (
                  <Image src={instructor.avatar_url} alt={instructor.full_name} fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <User className="w-16 h-16 text-white/20" />
                  </div>
                )}
              </div>
              <h1 className="font-bold text-white mb-1">{instructor.full_name}</h1>
              {instructor.title && <p className="text-sm text-white/50 mb-4">{instructor.title}</p>}
              {instructor.linkedin_url && (
                <a href={instructor.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-brand hover:text-brand-light transition-colors">
                  <Linkedin className="w-4 h-4" /> LinkedIn
                </a>
              )}
              {instructor.bio && (
                <p className="text-sm text-white/50 leading-relaxed mt-4 text-left">{instructor.bio}</p>
              )}
            </div>
          </div>

          {/* Courses */}
          <div className="lg:col-span-2">
            <h2 className="font-bold text-white mb-6">
              Corsi di {instructor.full_name} ({(courses ?? []).length})
            </h2>
            {(courses ?? []).length === 0 ? (
              <p className="text-white/40">Nessun corso disponibile al momento.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {(courses ?? []).map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}

            {(otherCourses ?? []).length > 0 && (
              <div className="mt-14">
                <h2 className="font-bold text-white mb-6">I corsi più seguiti dagli utenti</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {(otherCourses ?? []).map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
