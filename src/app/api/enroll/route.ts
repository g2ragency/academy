import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const { courseId } = await request.json()

  const { data: course } = await supabase
    .from('courses')
    .select('id, price_cents')
    .eq('id', courseId)
    .single()

  if (!course) return NextResponse.json({ error: 'Corso non trovato' }, { status: 404 })
  if (course.price_cents > 0) return NextResponse.json({ error: 'Corso a pagamento' }, { status: 400 })

  const { error } = await supabase.from('enrollments').upsert({
    user_id: user.id,
    course_id: courseId,
    status: 'active',
    amount_paid_cents: 0,
  }, { onConflict: 'user_id,course_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
