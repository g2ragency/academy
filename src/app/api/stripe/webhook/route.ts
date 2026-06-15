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
    const { course_ids, course_id, user_id } = session.metadata ?? {}

    // course_ids (carrello multi-corso) con fallback su course_id (legacy singolo)
    const ids = (course_ids ?? course_id ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    if (ids.length > 0 && user_id) {
      const admin = supabaseAdmin()
      // Importo per corso autorevole dal DB: l'amount_total Stripe è la somma
      const { data: courses } = await admin
        .from('courses')
        .select('id, price_cents')
        .in('id', ids)
      const priceMap = new Map((courses ?? []).map((c) => [c.id, c.price_cents]))
      const enrolledAt = new Date().toISOString()

      await admin.from('enrollments').upsert(
        ids.map((cid) => ({
          user_id,
          course_id: cid,
          status: 'active',
          stripe_payment_intent_id: session.payment_intent as string,
          amount_paid_cents: priceMap.get(cid) ?? 0,
          enrolled_at: enrolledAt,
        })),
        { onConflict: 'user_id,course_id' }
      )
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
