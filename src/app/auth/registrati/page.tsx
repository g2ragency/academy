'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const schema = z.object({
  full_name: z.string().min(2, 'Inserisci il tuo nome completo'),
  email: z.string().email('Email non valida'),
  company: z.string().optional(),
  password: z.string().min(8, 'La password deve avere almeno 8 caratteri'),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Le password non coincidono',
  path: ['confirm_password'],
})

type FormData = z.infer<typeof schema>

export default function RegistratiPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.full_name, company: data.company },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('Questa email è già registrata. Prova ad accedere.')
      } else {
        toast.error(error.message)
      }
      return
    }

    setDone(true)
  }

  if (done) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center mx-auto mb-6">
          <span className="text-brand text-2xl">✓</span>
        </div>
        <h1 className="font-bold text-white mb-3">Controlla la tua email</h1>
        <p className="text-white/50 mb-6">
          Ti abbiamo inviato un link di conferma. Clicca sul link per attivare il tuo account.
        </p>
        <Link href="/auth/login" className="btn-primary inline-flex">
          Vai al login
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="font-bold text-white mb-2">Crea il tuo account</h1>
        <p className="text-white/50 text-sm">Inizia a imparare dai migliori esperti</p>
      </div>

      <div className="card p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            {...register('full_name')}
            id="full_name"
            label="Nome completo"
            placeholder="Mario Rossi"
            error={errors.full_name?.message}
            autoComplete="name"
          />

          <Input
            {...register('email')}
            id="email"
            type="email"
            label="Email aziendale"
            placeholder="mario@holding.it"
            error={errors.email?.message}
            autoComplete="email"
          />

          <Input
            {...register('company')}
            id="company"
            label="Azienda / Holding (opzionale)"
            placeholder="Rossi Holding S.p.A."
            autoComplete="organization"
          />

          <div className="relative">
            <Input
              {...register('password')}
              id="password"
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder="Minimo 8 caratteri"
              error={errors.password?.message}
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[38px] text-white/30 hover:text-white/60">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <Input
            {...register('confirm_password')}
            id="confirm_password"
            type={showPassword ? 'text' : 'password'}
            label="Conferma password"
            placeholder="Ripeti la password"
            error={errors.confirm_password?.message}
            autoComplete="new-password"
          />

          <p className="text-xs text-white/30">
            Registrandoti accetti i{' '}
            <Link href="/termini" className="text-brand hover:underline">Termini di servizio</Link>
            {' '}e la{' '}
            <Link href="/privacy" className="text-brand hover:underline">Privacy Policy</Link>.
          </p>

          <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
            <UserPlus className="w-4 h-4" />
            Crea account
          </Button>
        </form>
      </div>

      <p className="text-center text-sm text-white/40 mt-6">
        Hai già un account?{' '}
        <Link href="/auth/login" className="text-brand hover:text-brand-light transition-colors font-medium">
          Accedi
        </Link>
      </p>
    </div>
  )
}
