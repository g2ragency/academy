import { createServerClient } from '@/lib/supabase/server'
import Hero from '@/components/home/Hero'
import TrendingCourses from '@/components/home/TrendingCourses'
import Instructors from '@/components/home/Instructors'
import BrandLogos from '@/components/home/BrandLogos'
import CourseTypes from '@/components/home/CourseTypes'
import FAQ from '@/components/home/FAQ'

export const dynamic = 'force-dynamic'

async function getHomeData() {
  const supabase = createServerClient()

  const [{ data: courses }, { data: instructors }, { data: popularity }] = await Promise.all([
    supabase
      .from('courses')
      .select('*, instructor:instructors!courses_instructor_id_fkey(*)')
      .eq('status', 'published')
      .order('sort_order', { ascending: true })
      .limit(12),
    supabase
      .from('instructors')
      .select('*')
      .order('sort_order', { ascending: true })
      .limit(10),
    supabase.from('course_popularity').select('course_id, enrollment_count'),
  ])

  // Tendenza: prima per numero di iscritti, a parità l'ordinamento manuale
  const countByCourse = new Map((popularity ?? []).map((p) => [p.course_id, p.enrollment_count as number]))
  const sortedCourses = (courses ?? []).sort((a, b) =>
    (countByCourse.get(b.id) ?? 0) - (countByCourse.get(a.id) ?? 0) || a.sort_order - b.sort_order
  )

  return { courses: sortedCourses, instructors: instructors ?? [] }
}

export default async function HomePage() {
  const { courses, instructors } = await getHomeData()

  // Card della hero: featured prima, poi l'ordine esistente (max 12)
  const heroCourses = [...courses]
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .slice(0, 12)
    .map((c) => ({ id: c.id, slug: c.slug, title: c.title, thumbnail_url: c.thumbnail_url }))

  return (
    <>
      <Hero courses={heroCourses} />
      <TrendingCourses courses={courses} />
      <BrandLogos />
      <Instructors instructors={instructors} />
      <CourseTypes />
      <FAQ />
    </>
  )
}
