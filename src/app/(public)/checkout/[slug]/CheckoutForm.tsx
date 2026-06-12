'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Play } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getMediaUrl } from '@/lib/media'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatPrice } from '@/lib/utils'
import type { Course, Profile } from '@/types'

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

interface Props {
  course: Course
  profile: Profile
}

/**
 * Checkout (design Figma): dati di fatturazione a sinistra, riepilogo sticky
 * a destra. Al submit i dati vengono salvati sul profilo e si prosegue verso
 * il pagamento Stripe (dove sono disponibili anche Apple Pay / Google Pay).
 * Carrello multi-corso: rimandato — per ora un corso per checkout.
 */
export default function CheckoutForm({ course, profile }: Props) {
  const [paying, setPaying] = useState(false)
  const supabase = createClient()
  const thumb = getMediaUrl(course.thumbnail_url)

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
    setPaying(true)
    try {
      // Salva i dati di fatturazione sul profilo (riusati al prossimo acquisto)
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
        body: JSON.stringify({ courseId: course.id, orderNotes: data.order_notes || undefined }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      window.location.href = json.url
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Si è verificato un errore')
      setPaying(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid lg:grid-cols-3 gap-10">
      {/* Colonna form */}
      <div className="lg:col-span-2">
        <h5 className="text-white">Checkout</h5>

        <h6 className="text-white mt-10 mb-6">Dati di fatturazione</h6>

        <div className="space-y-4 max-w-3xl">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              {...register('first_name')}
              id="first_name"
              label="Nome*"
              placeholder="Mario"
              autoComplete="given-name"
              error={errors.first_name?.message}
            />
            <Input
              {...register('last_name')}
              id="last_name"
              label="Cognome*"
              placeholder="Rossi"
              autoComplete="family-name"
              error={errors.last_name?.message}
            />
          </div>

          <div className="space-y-2">
            <Input
              {...register('street')}
              id="street"
              label="Via e numero*"
              placeholder="Via / Piazza e Numero civico"
              autoComplete="address-line1"
              error={errors.street?.message}
            />
            <Input
              {...register('street_extra')}
              id="street_extra"
              placeholder="Appartamento / Informazioni / Unità / ecc."
              autoComplete="address-line2"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              {...register('company')}
              id="company"
              label="Azienda"
              placeholder="Rossi Holding S.p.A."
              autoComplete="organization"
            />
            <Input
              {...register('website')}
              id="website"
              label="Sito web"
              placeholder="www.rossi.it"
              autoComplete="url"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Input
              {...register('city')}
              id="city"
              label="Città*"
              placeholder="Roma"
              autoComplete="address-level2"
              error={errors.city?.message}
            />
            <Input
              {...register('province')}
              id="province"
              label="Provincia*"
              placeholder="Roma"
              autoComplete="address-level1"
              error={errors.province?.message}
            />
            <Input
              {...register('zip')}
              id="zip"
              label="CAP*"
              placeholder="00197"
              autoComplete="postal-code"
              error={errors.zip?.message}
            />
          </div>

          <div>
            <label htmlFor="order_notes" className="label">Note sull&apos;ordine</label>
            <textarea
              {...register('order_notes')}
              id="order_notes"
              rows={5}
              placeholder="Facoltativo"
              className="input resize-none"
            />
          </div>
        </div>
      </div>

      {/* Riepilogo del carrello (sticky) */}
      <div className="lg:col-span-1">
        <div className="card p-6 sticky top-24">
          <h6 className="text-white mb-6">Riepilogo del carrello</h6>

          <div className="flex items-center gap-4 pb-5 border-b border-surface-border">
            <div className="w-20 aspect-video rounded-lg overflow-hidden relative bg-surface-elevated shrink-0">
              {thumb ? (
                <Image src={thumb} alt={course.title} fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="w-5 h-5 text-white/20" />
                </div>
              )}
            </div>
            <p className="text-sm text-white flex-1 line-clamp-2">{course.title}</p>
            <p className="text-sm text-white shrink-0">{formatPrice(course.price_cents)}</p>
          </div>

          <div className="flex items-baseline gap-2 pt-6 mb-6">
            <span className="text-4xl text-white">{formatPrice(course.price_cents)}</span>
            <span className="text-xs text-muted">IVA inclusa</span>
          </div>

          <Button type="submit" loading={isSubmitting || paying} className="w-full" size="lg">
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
