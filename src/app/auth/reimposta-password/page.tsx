'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import AuthField from '../AuthField'

const schema = z.object({
  password: z.string().min(8, 'La password deve avere almeno 8 caratteri'),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Le password non coincidono',
  path: ['confirm_password'],
})

type FormData = z.infer<typeof schema>

/** Arrivo dal link email di recovery: il callback ha già creato la sessione */
export default function ReimpostaPasswordPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [hasSession, setHasSession] = useState<boolean | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session))
  }, [supabase])

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Password aggiornata!')
    router.push('/dashboard')
    router.refresh()
  }

  if (hasSession === null) return null

  if (!hasSession) {
    return (
      <div className="w-full max-w-md text-center">
        <h5 className="text-white mb-3">Link non valido o scaduto</h5>
        <p className="text-base text-muted mb-8">
          Richiedi un nuovo link di recupero per reimpostare la password.
        </p>
        <Link href="/auth/recupera-password" className="btn-primary inline-flex">
          Richiedi nuovo link
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-10">
        <h5 className="text-white mb-2">Imposta una nuova password</h5>
        <p className="text-base text-muted">Scegli la nuova password per il tuo account.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <AuthField
          {...register('password')}
          icon={<Lock />}
          type={showPassword ? 'text' : 'password'}
          placeholder="Nuova password*"
          autoComplete="new-password"
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

        <AuthField
          {...register('confirm_password')}
          icon={<Lock />}
          type={showPassword ? 'text' : 'password'}
          placeholder="Conferma nuova password*"
          autoComplete="new-password"
          error={errors.confirm_password?.message}
        />

        <Button type="submit" loading={isSubmitting} className="w-full mt-2" size="lg">
          Salva nuova password
        </Button>
      </form>
    </div>
  )
}
