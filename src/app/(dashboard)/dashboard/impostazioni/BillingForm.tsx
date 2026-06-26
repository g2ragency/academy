'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { Profile } from '@/types'

export default function BillingForm({ profile }: { profile: Profile }) {
  const [form, setForm] = useState({
    tax_code: profile.tax_code ?? '',
    vat_number: profile.vat_number ?? '',
    sdi_code: profile.sdi_code ?? '',
    billing_address: profile.billing_address ?? '',
  })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const save = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        tax_code: form.tax_code.trim() || null,
        vat_number: form.vat_number.trim() || null,
        sdi_code: form.sdi_code.trim() || null,
        billing_address: form.billing_address.trim() || null,
      })
      .eq('id', profile.id)
    setSaving(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Dati di fatturazione salvati')
  }

  return (
    <div className="card p-6 space-y-4">
      <div className="border-b border-surface-border pb-3">
        <h5 className="text-white">Dati di fatturazione</h5>
        <p className="text-xs text-white/30 mt-1">
          Usati come riferimento per le fatture. Tutti i campi sono facoltativi.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input id="tax-code" label="Codice fiscale" value={form.tax_code} onChange={set('tax_code')} />
        <Input id="vat" label="Partita IVA" value={form.vat_number} onChange={set('vat_number')} />
        <Input id="sdi" label="Codice SDI" value={form.sdi_code} onChange={set('sdi_code')} placeholder="es. 0000000" />
        <Input id="addr" label="Indirizzo di fatturazione" value={form.billing_address} onChange={set('billing_address')} />
      </div>
      <Button onClick={save} loading={saving} size="sm" className="gap-1.5 h-11 md:h-[50px] px-5">
        <Save className="w-3.5 h-3.5" /> Salva
      </Button>
    </div>
  )
}
