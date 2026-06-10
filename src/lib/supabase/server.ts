import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Profile } from '@/types'

export const createServerClient = () =>
  createServerComponentClient({ cookies })

export async function getProfile(): Promise<Profile | null> {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return data
}

export async function requireAuth() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user
}

export async function requireAdmin() {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') throw new Error('Not authorized')
  return profile
}
