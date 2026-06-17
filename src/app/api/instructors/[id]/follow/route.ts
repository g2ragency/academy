import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const { data: existing } = await supabase
    .from('instructor_follows')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('instructor_id', params.id)
    .single()

  if (existing) {
    await supabase
      .from('instructor_follows')
      .delete()
      .eq('user_id', user.id)
      .eq('instructor_id', params.id)
    return NextResponse.json({ following: false, notify: false })
  }

  await supabase
    .from('instructor_follows')
    .insert({ user_id: user.id, instructor_id: params.id })
  return NextResponse.json({ following: true, notify: false })
}
