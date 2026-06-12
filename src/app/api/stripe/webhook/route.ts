import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return NextResponse.json({ error: 'Webhook signature invalid' }, { status: 400 })
  }

  const supabaseAdmin = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { course_id, user_id } = session.metadata ?? {}

    if (course_id && user_id) {
      await supabaseAdmin().from('enrollments').upsert({
        user_id,
        course_id,
        status: 'active',
        stripe_payment_intent_id: session.payment_intent as string,
        amount_paid_cents: session.amount_total ?? 0,
        enrolled_at: new Date().toISOString(),
      }, { onConflict: 'user_id,course_id' })
    }
  }

  // Rimborso: revoca l'accesso al corso
  if (event.type === 'charge.refunded') {
    const charge = event.data.object as Stripe.Charge
    const paymentIntentId = charge.payment_intent as string | null
    if (paymentIntentId) {
      await supabaseAdmin()
        .from('enrollments')
        .update({ status: 'cancelled' })
        .eq('stripe_payment_intent_id', paymentIntentId)
    }
  }

  return NextResponse.json({ received: true })
}
