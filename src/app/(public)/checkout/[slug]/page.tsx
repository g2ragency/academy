import { notFound, redirect } from 'next/navigation'
import { createServerClient, getProfile } from '@/lib/supabase/server'
import CheckoutForm from './CheckoutForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Checkout' }

interface Props { params: { slug: string } }

export default async function CheckoutPage({ params }: Props) {
  const profile = await getProfile()
  if (!profile) redirect(`/auth/login?redirect=/checkout/${params.slug}`)

  const supabase = createServerClient()
  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single()

  if (!course) notFound()
  // I corsi gratuiti non passano dal checkout
  if (course.price_cents === 0) redirect(`/corsi/${params.slug}`)

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id, status')
    .eq('user_id', profile.id)
    .eq('course_id', course.id)
    .single()
  if (enrollment?.status === 'active') redirect(`/dashboard/corsi/${params.slug}`)

  return (
    <div className="min-h-screen bg-surface pt-24 pb-20">
      <div className="container-wide">
        <CheckoutForm course={course} profile={profile} />
      </div>
    </div>
  )
}
