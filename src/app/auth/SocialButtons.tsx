'use client'

import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { safeRedirect } from '@/lib/utils'

interface Props {
  /** Testo del divisore, es. "Oppure entra con" / "Oppure registrati con" */
  label: string
  /** Path a cui tornare dopo l'OAuth */
  redirect?: string
}

/** Divisore + bottoni Google/Apple (design Figma). I provider vanno abilitati nel dashboard Supabase. */
export default function SocialButtons({ label, redirect = '/dashboard' }: Props) {
  const supabase = createClient()

  const signInWith = async (provider: 'google' | 'apple') => {
    const safe = encodeURIComponent(safeRedirect(redirect))
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?redirect=${safe}` },
    })
    if (error) {
      toast.error(`Accesso con ${provider === 'google' ? 'Google' : 'Apple'} non disponibile al momento`)
    }
  }

  return (
    <div>
      <div className="relative my-[50px]">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-surface-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-4 bg-surface text-[14px] sm:text-[18px] leading-none text-muted">{label}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => signInWith('google')}
          className="flex items-center justify-center gap-2.5 h-10 sm:h-[65px] rounded-[10px] sm:rounded-[20px] bg-white text-black text-[16px] sm:text-[18px] leading-none hover:bg-white/80 transition-colors"
        >
          <GoogleIcon />
          Google
        </button>
        <button
          type="button"
          onClick={() => signInWith('apple')}
          className="flex items-center justify-center gap-2.5 h-10 sm:h-[65px] rounded-[10px] sm:rounded-[20px] bg-white text-black text-[16px] sm:text-[18px] leading-none hover:bg-white/80 transition-colors"
        >
          <AppleIcon />
          Apple
        </button>
      </div>
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

function AppleIcon() {
  return (
    <svg width="16" height="18" viewBox="0 0 16 19" fill="currentColor">
      <path d="M13.07 9.93c.02 2.4 2.1 3.2 2.13 3.21-.02.06-.33 1.14-1.1 2.25-.66.96-1.35 1.92-2.43 1.94-1.07.02-1.41-.63-2.63-.63-1.22 0-1.6.61-2.6.65-1.05.04-1.85-1.04-2.51-2-1.37-1.98-2.41-5.58-1.01-8.02.7-1.21 1.95-1.97 3.3-1.99 1.03-.02 2 .69 2.63.69.63 0 1.81-.86 3.05-.73.52.02 1.98.21 2.92 1.58-.08.05-1.74 1.02-1.75 3.05zM11.06 3.99c.56-.67.93-1.61.83-2.55-.8.03-1.77.54-2.35 1.21-.51.59-.96 1.55-.84 2.46.9.07 1.81-.45 2.36-1.12z" />
    </svg>
  )
}
