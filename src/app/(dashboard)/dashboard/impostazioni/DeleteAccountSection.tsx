'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

export default function DeleteAccountSection() {
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const deleteAccount = async () => {
    setDeleting(true)
    const res = await fetch('/api/account/delete', { method: 'POST' })
    setDeleting(false)
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      toast.error(body?.error ?? 'Errore nell\'eliminazione dell\'account')
      return
    }
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="card p-6 space-y-4 border-red-500/20">
      <div className="border-b border-surface-border pb-3">
        <h5 className="text-white">Eliminazione account</h5>
        <p className="text-xs text-white/30 mt-1">
          Elimina definitivamente account, iscrizioni, progressi e attestati. Operazione irreversibile.
        </p>
      </div>
      <Button onClick={() => setOpen(true)} variant="secondary" size="sm" className="gap-1.5 text-red-400 h-11 md:h-[50px] px-5">
        <Trash2 className="w-3.5 h-3.5" /> Elimina il mio account
      </Button>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-surface/50 backdrop-blur-[10px] border border-surface-border rounded-2xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h5 className="text-white">Conferma eliminazione</h5>
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-white/60">
              Questa operazione è <span className="text-red-400">irreversibile</span>: perderai l&apos;accesso a tutti
              i corsi acquistati. Digita <span className="text-white">ELIMINA</span> per confermare.
            </p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="ELIMINA"
              className="input text-sm"
            />
            <div className="flex gap-3">
              <Button
                onClick={deleteAccount}
                loading={deleting}
                disabled={confirmText !== 'ELIMINA'}
                size="sm"
                className="gap-1.5 bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30"
              >
                <Trash2 className="w-3.5 h-3.5" /> Elimina definitivamente
              </Button>
              <Button onClick={() => setOpen(false)} variant="ghost" size="sm">Annulla</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
