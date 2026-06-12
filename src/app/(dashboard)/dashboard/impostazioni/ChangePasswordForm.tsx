'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function ChangePasswordForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const save = async () => {
    if (password.length < 8) {
      toast.error('La password deve avere almeno 8 caratteri')
      return
    }
    if (password !== confirm) {
      toast.error('Le password non coincidono')
      return
    }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Password aggiornata')
    setPassword('')
    setConfirm('')
  }

  return (
    <div className="card p-6 space-y-4">
      <h5 className="text-white border-b border-surface-border pb-3">Cambio password</h5>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input
          id="new-pwd"
          type="password"
          label="Nuova password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimo 8 caratteri"
        />
        <Input
          id="confirm-pwd"
          type="password"
          label="Conferma password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      <Button onClick={save} loading={saving} size="sm" className="gap-1.5">
        <Save className="w-3.5 h-3.5" /> Aggiorna password
      </Button>
    </div>
  )
}
