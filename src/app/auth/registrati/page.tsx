'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Briefcase, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import AuthField from '../AuthField'
import AuthCheckbox from '../AuthCheckbox'
import SocialButtons from '../SocialButtons'
import LockIcon from '@/components/icons/LockIcon'
import MailIcon from '@/components/icons/MailIcon'
import EyeIcon from '@/components/icons/EyeIcon'

const schema = z.object({
  full_name: z.string().min(2, 'Inserisci il tuo nome completo'),
  email: z.string().email('Email non valida'),
  company: z.string().optional(),
  password: z.string().min(8, 'La password deve avere almeno 8 caratteri'),
  confirm_password: z.string(),
  accept_terms: z.boolean().refine((v) => v, 'Devi accettare i Termini e la Privacy Policy'),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Le password non coincidono',
  path: ['confirm_password'],
})

type FormData = z.infer<typeof schema>

export default function RegistratiPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [done, setDone] = useState(false)
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
        <div className="w-16 h-16 rounded-full bg-surface-elevated border border-surface-border flex items-center justify-center mx-auto mb-6">
          <span className="text-white text-2xl">✓</span>
        </div>
        <h5 className="text-white text-[18px] leading-[22px] sm:text-[32px] sm:leading-[56px] mb-3">Controlla la tua email</h5>
        <p className="text-[16px] sm:text-[24px] leading-none text-muted mb-8">
          Ti abbiamo inviato un link di conferma. Clicca sul link per attivare il tuo account.
        </p>
        <Link href="/auth/login" className="btn-primary inline-flex">
          Vai al login
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[554px]">
      <div className="text-center mb-10">
        <h5 className="text-white text-[18px] leading-[22px] sm:text-[32px] sm:leading-[56px] mb-2">Crea il tuo account</h5>
        <p className="text-[16px] sm:text-[24px] leading-none text-muted">Inserisci i tuoi dati per registrarti.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <AuthField
          {...register('full_name')}
          icon={<User className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px]" />}
          placeholder="Nome e cognome*"
          autoComplete="name"
          error={errors.full_name?.message}
        />

        <AuthField
          {...register('email')}
          icon={<MailIcon />}
          type="email"
          placeholder="Inserisci la tua Email*"
          autoComplete="email"
          error={errors.email?.message}
        />

        <AuthField
          {...register('company')}
          icon={<Briefcase className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px]" />}
          placeholder="Azienda / Holding (opzionale)"
          autoComplete="organization"
        />

        <AuthField
          {...register('password')}
          icon={<LockIcon />}
          type={showPassword ? 'text' : 'password'}
          placeholder="Crea una password*"
          autoComplete="new-password"
          error={errors.password?.message}
          rightSlot={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
              className="text-muted hover:text-white transition-colors shrink-0"
            >
              <EyeIcon className="w-[18px] h-[18px] sm:w-6 sm:h-6" />
            </button>
          }
        />

        <AuthField
          {...register('confirm_password')}
          icon={<LockIcon />}
          type={showPassword ? 'text' : 'password'}
          placeholder="Conferma password*"
          autoComplete="new-password"
          error={errors.confirm_password?.message}
        />

        <div className="!mt-6">
          <label className="flex items-start gap-2.5 text-[14px] sm:text-[18px] leading-none text-muted cursor-pointer">
            <AuthCheckbox {...register('accept_terms')} className="mt-0.5" />
            <span>
              Accetto i{' '}
              <Link href="/termini" className="text-white underline underline-offset-4 hover:text-white/70">Termini e Condizioni</Link>
              {' '}e la{' '}
              <Link href="/privacy" className="text-white underline underline-offset-4 hover:text-white/70">Privacy Policy</Link>*
            </span>
          </label>
          {errors.accept_terms && <p className="text-xs text-red-400 mt-1.5">{errors.accept_terms.message}</p>}
        </div>

        <Button type="submit" loading={isSubmitting} className="w-full !mt-[40px] h-10 sm:h-[65px] sm:rounded-[20px] text-[16px] sm:text-[18px] leading-none" size="lg">
          Registrati
        </Button>
      </form>

      <SocialButtons label="Oppure registrati con" />

      <p className="text-center text-[16px] sm:text-[24px] leading-none text-muted mt-[40px]">
        Hai già un account?{' '}
        <Link href="/auth/login" className="text-white underline underline-offset-4 hover:text-white/70 transition-colors">
          Accedi
        </Link>
      </p>
    </div>
  )
}
