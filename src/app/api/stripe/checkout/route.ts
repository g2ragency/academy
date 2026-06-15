import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import type Stripe from 'stripe'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const body = await request.json()
    // Accetta sia il carrello multi-corso (courseIds) sia il singolo legacy (courseId)
    const rawIds: string[] = Array.isArray(body.courseIds)
      ? body.courseIds
      : body.courseId
        ? [body.courseId]
        : []
    const orderNotes: string | undefined = body.orderNotes
    const courseIds = Array.from(new Set(rawIds.filter(Boolean)))

    if (courseIds.length === 0) {
      return NextResponse.json({ error: 'Carrello vuoto' }, { status: 400 })
    }

    // Prezzi autorevoli dal DB (mai fidarsi del client)
    const { data: courses } = await supabase
      .from('courses')
      .select('id, title, price_cents, stripe_price_id')
      .in('id', courseIds)
      .eq('status', 'published')

    if (!courses || courses.length === 0) {
      return NextResponse.json({ error: 'Corsi non trovati' }, { status: 404 })
    }

    // Esclude i corsi a cui l'utente è già iscritto e quelli gratuiti
    const { data: enrolled } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('user_id', user.id)
      .in('course_id', courseIds)
    const enrolledIds = new Set((enrolled ?? []).map((e) => e.course_id))

    const payable = courses.filter((c) => c.price_cents > 0 && !enrolledIds.has(c.id))

    if (payable.length === 0) {
      return NextResponse.json(
        { error: 'Nessun corso da acquistare (già acquistati o gratuiti)' },
        { status: 400 }
      )
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = payable.map((c) =>
      c.stripe_price_id
        ? { price: c.stripe_price_id, quantity: 1 }
        : {
            price_data: {
              currency: 'eur',
              product_data: { name: c.title },
              unit_amount: c.price_cents,
            },
            quantity: 1,
          }
    )

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      success_url: `${siteUrl}/dashboard?enrolled=1`,
      cancel_url: `${siteUrl}/checkout`,
      customer_email: user.email,
      // Fatturazione: Stripe genera la fattura PDF e raccoglie indirizzo + P.IVA.
      // La fattura elettronica SDI resta fuori scope (gestione via export Stripe).
      invoice_creation: { enabled: true },
      billing_address_collection: 'required',
      tax_id_collection: { enabled: true },
      metadata: {
        // Il webhook itera su questi id per creare un enrollment per corso
        course_ids: payable.map((c) => c.id).join(','),
        user_id: user.id,
        ...(orderNotes ? { order_notes: String(orderNotes).slice(0, 450) } : {}),
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Errore interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
