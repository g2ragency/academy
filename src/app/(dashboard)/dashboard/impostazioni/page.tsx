import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/supabase/server'
import ChangePasswordForm from './ChangePasswordForm'
import BillingForm from './BillingForm'
import DeleteAccountSection from './DeleteAccountSection'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Impostazioni' }

export default async function ImpostazioniPage() {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')

  return (
    <div className="py-10">
      <div className="container-wide">
        <div className="mb-10">
          <h1 className="font-bold text-white">Impostazioni</h1>
          <p className="text-white/50 mt-1">
            Sicurezza, dati di fatturazione e gestione dell&apos;account. Nome, foto ed email si modificano dal{' '}
            <a href="/dashboard/profilo" className="text-white/70 hover:text-white underline">profilo</a>.
          </p>
        </div>

        <div className="space-y-6 max-w-2xl">
          <ChangePasswordForm />
          <BillingForm profile={profile} />
          <DeleteAccountSection />
        </div>
      </div>
    </div>
  )
}
