import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { courseId } = await request.json()

    const { data: course } = await supabase
      .from('courses')
      .select('id, title, price_cents, stripe_price_id')
      .eq('id', courseId)
      .single()

    if (!course) {
      return NextResponse.json({ error: 'Corso non trovato' }, { status: 404 })
    }

    const { data: existing } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Già iscritto a questo corso' }, { status: 400 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: course.stripe_price_id
        ? [{ price: course.stripe_price_id, quantity: 1 }]
        : [{
            price_data: {
              currency: 'eur',
              product_data: { name: course.title },
              unit_amount: course.price_cents,
            },
            quantity: 1,
          }],
      success_url: `${siteUrl}/dashboard/corsi?enrolled=${courseId}`,
      cancel_url: `${siteUrl}/corsi`,
      customer_email: user.email,
      // Fatturazione: Stripe genera la fattura PDF e raccoglie indirizzo + P.IVA.
      // La fattura elettronica SDI resta fuori scope (gestione via export Stripe).
      invoice_creation: { enabled: true },
      billing_address_collection: 'required',
      tax_id_collection: { enabled: true },
      metadata: {
        course_id: courseId,
        user_id: user.id,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Errore interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
