import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function createCheckoutSession({
  courseId,
  courseName,
  priceId,
  userId,
  userEmail,
  successUrl,
  cancelUrl,
}: {
  courseId: string
  courseName: string
  priceId: string | null
  userId: string
  userEmail: string
  successUrl: string
  cancelUrl: string
}) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: priceId
      ? [{ price: priceId, quantity: 1 }]
      : [],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: userEmail,
    metadata: {
      course_id: courseId,
      user_id: userId,
    },
  })

  return session
}
