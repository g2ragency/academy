'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Play, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/context/CartContext'
import { getMediaUrl } from '@/lib/media'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatPrice, cn } from '@/lib/utils'
import type { Profile } from '@/types'

const schema = z.object({
  first_name: z.string().min(1, 'Campo obbligatorio'),
  last_name: z.string().min(1, 'Campo obbligatorio'),
  street: z.string().min(3, 'Campo obbligatorio'),
  street_extra: z.string().optional(),
  company: z.string().optional(),
  website: z.string().optional(),
  city: z.string().min(2, 'Campo obbligatorio'),
  province: z.string().min(2, 'Campo obbligatorio'),
  zip: z.string().min(4, 'Campo obbligatorio'),
  order_notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

/**
 * Checkout (design Figma): dati di fatturazione + riepilogo del carrello.
 * Gli articoli arrivano dal CartContext (localStorage); i prezzi vengono
 * comunque riletti lato server dall'API prima del pagamento.
 */
export default function CheckoutClient({ profile }: { profile: Profile }) {
  const { items, totalCents, removeItem } = useCart()
  const supabase = createClient()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: profile.first_name ?? '',
      last_name: profile.last_name ?? '',
      company: profile.company ?? '',
      website: profile.website ?? '',
    },
  })

  const onSubmit = async (data: FormData) => {
    if (items.length === 0) {
      toast.error('Il carrello è vuoto')
      return
    }
    try {
      const billing_address = [
        data.street + (data.street_extra ? `, ${data.street_extra}` : ''),
        `${data.zip} ${data.city} (${data.province})`,
      ].join(' — ')
      await supabase
        .from('profiles')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          full_name: `${data.first_name} ${data.last_name}`.trim(),
          company: data.company || null,
          website: data.website || null,
          billing_address,
        })
        .eq('id', profile.id)

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseIds: items.map((i) => i.id),
          orderNotes: data.order_notes || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      window.location.href = json.url
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Si è verificato un errore')
    }
  }

  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <h5 className="text-white mb-3">Il carrello è vuoto</h5>
        <p className="text-muted mb-8">Aggiungi un corso per procedere all&apos;acquisto.</p>
        <Link href="/corsi" className="btn-primary inline-flex">Esplora i corsi</Link>
      </div>
    )
  }

  // Stili condivisi allineati al Figma (desktop node 1225:7637, mobile 1225:10176)
  const fieldLabel = 'text-[16px] lg:text-[22px] leading-[20px] lg:leading-[26px] text-white'
  const fieldInput = 'h-[40px] lg:h-[50px] py-0 rounded-[10px] border-[#989898] text-[16px] lg:text-[20px]'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid lg:grid-cols-3 gap-10">
      {/* Colonna form */}
      <div className="lg:col-span-2">
        <p className="text-[18px] leading-[22px] lg:text-[32px] lg:leading-[56px] text-white text-center lg:text-left">Checkout</p>
        <div className="hidden lg:block h-px bg-surface-border mt-6" />
        <p className="text-[18px] leading-[22px] lg:text-[32px] lg:leading-[56px] text-white mt-8 lg:mt-6 mb-6">Dati di fatturazione</p>

        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4 lg:gap-6">
            <Input {...register('first_name')} id="first_name" label="Nome*" labelClassName={fieldLabel} className={fieldInput} placeholder="Mario" autoComplete="given-name" error={errors.first_name?.message} />
            <Input {...register('last_name')} id="last_name" label="Cognome*" labelClassName={fieldLabel} className={fieldInput} placeholder="Rossi" autoComplete="family-name" error={errors.last_name?.message} />
          </div>

          <div className="space-y-3">
            <Input {...register('street')} id="street" label="Via e numero*" labelClassName={fieldLabel} className={fieldInput} placeholder="Via / Piazza e Numero civico" autoComplete="address-line1" error={errors.street?.message} />
            <Input {...register('street_extra')} id="street_extra" className={fieldInput} placeholder="Appartamento / Informazioni / Unità / ecc." autoComplete="address-line2" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4 lg:gap-6">
            <Input {...register('company')} id="company" label="Azienda" labelClassName={fieldLabel} className={fieldInput} placeholder="Rossi Holding S.p.A." autoComplete="organization" />
            <Input {...register('website')} id="website" label="Sito web" labelClassName={fieldLabel} className={fieldInput} placeholder="www.rossi.it" autoComplete="url" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 lg:gap-6">
            <Input {...register('city')} id="city" label="Città*" labelClassName={fieldLabel} className={fieldInput} placeholder="Roma" autoComplete="address-level2" error={errors.city?.message} />
            <Input {...register('province')} id="province" label="Provincia*" labelClassName={fieldLabel} className={fieldInput} placeholder="Roma" autoComplete="address-level1" error={errors.province?.message} />
            <Input {...register('zip')} id="zip" label="CAP*" labelClassName={fieldLabel} className={fieldInput} placeholder="00197" autoComplete="postal-code" error={errors.zip?.message} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="order_notes" className={cn('block', fieldLabel)}>Note sull&apos;ordine</label>
            <textarea {...register('order_notes')} id="order_notes" rows={5} placeholder="Facoltativo" className="input resize-none rounded-[13px] border-[#989898] h-[120px] lg:h-[153px] text-[16px] lg:text-[20px]" />
          </div>
        </div>
      </div>

      {/* Riepilogo del carrello (sticky). Card #1b1b1b solo da lg; su mobile
          il riepilogo collassa a totale + bottone su sfondo nero (come Figma). */}
      <div className="lg:col-span-1">
        <div className="lg:bg-card lg:rounded-[40px] lg:p-6 lg:sticky lg:top-24">
          <p className="hidden lg:block text-[29px] leading-none text-white mb-6">Riepilogo del carrello</p>

          {/* Lista prodotti: solo desktop (Figma mobile mostra solo il totale) */}
          <div className="hidden lg:block divide-y divide-surface-border border-b border-surface-border mb-6">
            {items.map((item) => {
              const thumb = getMediaUrl(item.thumbnail_url)
              return (
                <div key={item.id} className="flex gap-[15px] py-[18px] first:pt-0">
                  <div className="w-[130px] h-[90px] rounded-[11px] overflow-hidden relative bg-surface-card shrink-0">
                    {thumb ? (
                      <Image src={thumb} alt={item.title} fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="w-5 h-5 text-white/20" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 h-[90px] flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[18px] leading-[20px] text-white line-clamp-2">{item.title}</p>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        aria-label={`Rimuovi ${item.title}`}
                        className="text-muted hover:text-white transition-colors shrink-0 -mt-0.5"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {/* ponytail: weight 700 = eccezione "tutto 400" (spec Figma prezzo riepilogo); faccia Bold caricata in layout.tsx */}
                    <p style={{ fontWeight: 700 }} className="text-[18px] leading-[20px] text-white mt-auto">{formatPrice(item.price_cents)}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Totale: su mobile preceduto da una linea (Figma) */}
          <div className="h-px bg-surface-border mb-4 lg:hidden" />
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-[48px] lg:text-[64px] leading-none text-white">{formatPrice(totalCents)}</span>
            <span className="text-[18px] leading-none text-muted">IVA inclusa</span>
          </div>

          <Button type="submit" loading={isSubmitting} className="w-full h-[40px] lg:h-[65px] rounded-[10px] lg:rounded-[20px] text-[18px] lg:text-[22px]">
            Acquista
          </Button>
          <p className="text-xs text-muted text-center mt-4">
            Pagamento sicuro con Stripe (carta, Apple Pay, Google Pay)
          </p>
        </div>
      </div>
    </form>
  )
}
