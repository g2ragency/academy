import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import type Stripe from 'stripe'

/**
 * Redirect alla ricevuta Stripe del pagamento, on-demand (i receipt_url
 * non vengono salvati perché possono scadere). Solo per i propri acquisti.
 */
export async function GET(
  _request: Request,
  { params }: { params: { paymentIntentId: string } }
) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
  }

  // Il payment intent deve appartenere a un acquisto dell'utente (RLS sugli enrollments)
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('stripe_payment_intent_id', params.paymentIntentId)
    .single()

  if (!enrollment) {
    return NextResponse.json({ error: 'Acquisto non trovato' }, { status: 404 })
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(params.paymentIntentId, {
      expand: ['latest_charge'],
    })
    const charge = paymentIntent.latest_charge as Stripe.Charge | null
    if (charge?.receipt_url) {
      return NextResponse.redirect(charge.receipt_url)
    }
    return NextResponse.json({ error: 'Ricevuta non disponibile' }, { status: 404 })
  } catch {
    return NextResponse.json({ error: 'Errore nel recupero della ricevuta' }, { status: 500 })
  }
}
