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

  const [{ data: courses }, { data: instructors }] = await Promise.all([
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
  ])

  return { courses: courses ?? [], instructors: instructors ?? [] }
}

export default async function HomePage() {
  const { courses, instructors } = await getHomeData()

  return (
    <>
      <Hero />
      <TrendingCourses courses={courses} />
      <BrandLogos />
      <Instructors instructors={instructors} />
      <CourseTypes />
      <FAQ />
    </>
  )
}
