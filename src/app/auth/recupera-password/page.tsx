'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import AuthField from '../AuthField'

const schema = z.object({
  email: z.string().email('Email non valida'),
})

type FormData = z.infer<typeof schema>

export default function RecuperaPasswordPage() {
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/callback?redirect=/auth/reimposta-password`,
    })
    if (error) {
      toast.error(error.message)
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-surface-elevated border border-surface-border flex items-center justify-center mx-auto mb-6">
          <Mail className="w-7 h-7 text-white" />
        </div>
        <h5 className="text-white mb-3">Controlla la tua email</h5>
        <p className="text-base text-muted mb-8">
          Se l&apos;indirizzo è registrato, riceverai un link per reimpostare la password.
        </p>
        <Link href="/auth/login" className="btn-primary inline-flex">
          Torna al login
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-10">
        <h5 className="text-white mb-2">Recupera password</h5>
        <p className="text-base text-muted">
          Inserisci la tua email: ti invieremo un link per reimpostarla.
        </p>
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

        <Button type="submit" loading={isSubmitting} className="w-full mt-2" size="lg">
          Invia link di recupero
        </Button>
      </form>

      <p className="text-center text-sm text-muted mt-10">
        Ricordi la password?{' '}
        <Link href="/auth/login" className="text-white underline underline-offset-4 hover:text-white/70 transition-colors">
          Accedi
        </Link>
      </p>
    </div>
  )
}
