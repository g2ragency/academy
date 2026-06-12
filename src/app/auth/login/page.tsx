'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import AuthField from '../AuthField'
import SocialButtons from '../SocialButtons'

const schema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(6, 'Password troppo corta'),
  remember: z.boolean().optional(),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/dashboard'
  const supabase = createClient()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { remember: true },
  })

  const onSubmit = async (data: FormData) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      toast.error(error.message === 'Invalid login credentials' ? 'Email o password errati' : error.message)
      return
    }
    router.push(redirect)
    router.refresh()
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-10">
        <h5 className="text-white mb-2">Bentornato!</h5>
        <p className="text-base text-muted">Inserisci le tue credenziali.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <AuthField
          {...register('email')}
          icon={<Mail />}
          type="email"
          placeholder="Inserisci la tua Email"
          autoComplete="email"
          error={errors.email?.message}
        />

        <AuthField
          {...register('password')}
          icon={<Lock />}
          type={showPassword ? 'text' : 'password'}
          placeholder="Inserisci la tua password"
          autoComplete="current-password"
          error={errors.password?.message}
          rightSlot={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
              className="text-white/40 hover:text-white transition-colors shrink-0"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
            <input type="checkbox" {...register('remember')} className="w-4 h-4 accent-brand rounded" />
            Ricorda
          </label>
          <Link
            href="/auth/recupera-password"
            className="text-sm text-white underline underline-offset-4 hover:text-white/70 transition-colors"
          >
            Password dimenticata?
          </Link>
        </div>

        <Button type="submit" loading={isSubmitting} className="w-full mt-2" size="lg">
          Entra
        </Button>
      </form>

      <SocialButtons label="Oppure entra con" redirect={redirect} />

      <p className="text-center text-sm text-muted mt-10">
        Non hai ancora un account?{' '}
        <Link href="/auth/registrati" className="text-white underline underline-offset-4 hover:text-white/70 transition-colors">
          Crea un account
        </Link>
      </p>
    </div>
  )
}
