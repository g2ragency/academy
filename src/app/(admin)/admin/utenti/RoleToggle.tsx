'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/types'

/** Badge ruolo cliccabile: promuove/declassa admin (RLS: solo admin, migration 009) */
export default function RoleToggle({ userId, role, isSelf }: {
  userId: string
  role: UserRole
  isSelf: boolean
}) {
  const [current, setCurrent] = useState<UserRole>(role)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  // Non si può cambiare il proprio ruolo (evita di auto-bloccarsi fuori)
  if (isSelf) {
    return (
      <span className="badge bg-surface-elevated text-white/40 border-surface-border text-xs gap-1" title="Non puoi modificare il tuo ruolo">
        <Shield className="w-3 h-3" /> Admin (tu)
      </span>
    )
  }

  const toggle = async () => {
    const next: UserRole = current === 'admin' ? 'user' : 'admin'
    if (!confirm(next === 'admin' ? 'Promuovere questo utente ad admin?' : 'Rimuovere i privilegi di admin?')) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ role: next }).eq('id', userId)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    setCurrent(next)
    toast.success('Ruolo aggiornato')
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      title={current === 'admin' ? 'Clicca per declassare a utente' : 'Clicca per promuovere ad admin'}
      className={`badge text-xs gap-1 transition-colors disabled:opacity-50 ${
        current === 'admin'
          ? 'bg-brand/20 text-brand border-brand/30 hover:bg-brand/30'
          : 'bg-surface-elevated text-white/60 border-surface-border hover:text-white'
      }`}
    >
      {current === 'admin' ? <><Shield className="w-3 h-3" /> Admin</> : 'Utente'}
    </button>
  )
}
