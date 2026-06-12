import { createServerClient } from '@/lib/supabase/server'
import { getTaxonomiesWithTerms } from '@/lib/taxonomy.server'
import Hero from '@/components/home/Hero'
import TrendingCourses from '@/components/home/TrendingCourses'
import Instructors from '@/components/home/Instructors'
import BrandLogos from '@/components/home/BrandLogos'
import CourseTypes from '@/components/home/CourseTypes'
import TopicChips from '@/components/home/TopicChips'
import FAQ from '@/components/home/FAQ'

export const dynamic = 'force-dynamic'

async function getHomeData() {
  const supabase = createServerClient()

  const [{ data: courses }, { data: instructors }, homeTaxonomies, { data: popularity }] = await Promise.all([
    supabase
      .from('courses')
      .select('*, instructor:instructors(*)')
      .eq('status', 'published')
      .order('sort_order', { ascending: true })
      .limit(12),
    supabase
      .from('instructors')
      .select('*')
      .order('sort_order', { ascending: true })
      .limit(10),
    getTaxonomiesWithTerms({ showInHome: true }),
    supabase.from('course_popularity').select('course_id, enrollment_count'),
  ])

  // Tendenza: prima per numero di iscritti, a parità l'ordinamento manuale
  const countByCourse = new Map((popularity ?? []).map((p) => [p.course_id, p.enrollment_count as number]))
  const sortedCourses = (courses ?? []).sort((a, b) =>
    (countByCourse.get(b.id) ?? 0) - (countByCourse.get(a.id) ?? 0) || a.sort_order - b.sort_order
  )

  return { courses: sortedCourses, instructors: instructors ?? [], homeTaxonomies }
}

export default async function HomePage() {
  const { courses, instructors, homeTaxonomies } = await getHomeData()

  return (
    <>
      <Hero />
      <TrendingCourses courses={courses} />
      <BrandLogos />
      <TopicChips taxonomies={homeTaxonomies} />
      <Instructors instructors={instructors} />
      <CourseTypes />
      <FAQ />
    </>
  )
}
