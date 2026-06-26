'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { safeRedirect } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import AuthField from '../AuthField'
import AuthCheckbox from '../AuthCheckbox'
import SocialButtons from '../SocialButtons'
import LockIcon from '@/components/icons/LockIcon'
import MailIcon from '@/components/icons/MailIcon'
import EyeIcon from '@/components/icons/EyeIcon'

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
  const redirect = safeRedirect(searchParams.get('redirect'))
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
    <div className="w-full max-w-[554px]">
      <div className="text-center mb-10">
        <h5 className="text-white text-[18px] leading-[22px] sm:text-[32px] sm:leading-[56px] mb-2">Bentornato!</h5>
        <p className="text-[16px] sm:text-[24px] leading-none text-muted">Inserisci le tue credenziali.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <AuthField
          {...register('email')}
          icon={<MailIcon />}
          type="email"
          placeholder="Inserisci la tua Email"
          autoComplete="email"
          error={errors.email?.message}
        />

        <AuthField
          {...register('password')}
          icon={<LockIcon />}
          type={showPassword ? 'text' : 'password'}
          placeholder="Inserisci la tua password"
          autoComplete="current-password"
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

        <div className="flex items-center justify-between !mt-6">
          <label className="flex items-center gap-2 text-[14px] sm:text-[18px] leading-none text-muted cursor-pointer">
            <AuthCheckbox {...register('remember')} />
            Ricorda
          </label>
          <Link
            href="/auth/recupera-password"
            className="text-[14px] sm:text-[18px] leading-none text-white underline underline-offset-4 hover:text-white/70 transition-colors"
          >
            Password dimenticata?
          </Link>
        </div>

        <Button type="submit" loading={isSubmitting} className="w-full !mt-[40px] h-10 sm:h-[65px] sm:rounded-[20px] text-[16px] sm:text-[18px] leading-none" size="lg">
          Entra
        </Button>
      </form>

      <SocialButtons label="Oppure entra con" redirect={redirect} />

      <p className="text-center text-[16px] sm:text-[24px] leading-none text-muted mt-[40px]">
        Non hai ancora un account?{' '}
        <Link href="/auth/registrati" className="text-white underline underline-offset-4 hover:text-white/70 transition-colors">
          Crea un account
        </Link>
      </p>
    </div>
  )
}
