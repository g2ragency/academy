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
import { Input } from '@/components/ui/Input'

const schema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(6, 'Password troppo corta'),
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
  })

  const onSubmit = async (data: FormData) => {
    const { error } = await supabase.auth.signInWithPassword(data)
    if (error) {
      toast.error(error.message === 'Invalid login credentials' ? 'Email o password errati' : error.message)
      return
    }
    router.push(redirect)
    router.refresh()
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}` },
    })
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Bentornato</h1>
        <p className="text-white/50 text-sm">Accedi al tuo account Academy</p>
      </div>

      <div className="card p-8">
        {/* Google button */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-surface-elevated border border-surface-border rounded-xl text-sm font-medium text-white/80 hover:text-white hover:border-white/20 transition-all mb-6"
        >
          <GoogleIcon />
          Continua con Google
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-surface-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-surface-card text-xs text-white/30">oppure</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="relative">
            <Input
              {...register('email')}
              id="email"
              type="email"
              label="Email"
              placeholder="nome@azienda.it"
              error={errors.email?.message}
              autoComplete="email"
            />
            <Mail className="absolute right-3 top-[38px] w-4 h-4 text-white/30" />
          </div>

          <div className="relative">
            <Input
              {...register('password')}
              id="password"
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder="••••••••"
              error={errors.password?.message}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[38px] text-white/30 hover:text-white/60"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex justify-end">
            <Link href="/auth/recupera-password" className="text-xs text-brand hover:text-brand-light transition-colors">
              Password dimenticata?
            </Link>
          </div>

          <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
            <Lock className="w-4 h-4" />
            Accedi
          </Button>
        </form>
      </div>

      <p className="text-center text-sm text-white/40 mt-6">
        Non hai un account?{' '}
        <Link href="/auth/registrati" className="text-brand hover:text-brand-light transition-colors font-medium">
          Registrati gratis
        </Link>
      </p>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  )
}
