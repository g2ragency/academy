import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/supabase/server'
import CheckoutClient from './CheckoutClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Checkout' }

export default async function CheckoutPage() {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login?redirect=/checkout')

  return (
    <div className="min-h-screen bg-surface pt-24 pb-20">
      <div className="container-wide">
        <CheckoutClient profile={profile} />
      </div>
    </div>
  )
}
