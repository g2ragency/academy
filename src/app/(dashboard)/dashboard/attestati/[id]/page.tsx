import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createServerClient, getProfile } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import PrintButton from './PrintButton'
import type { Certificate, Course, Instructor } from '@/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Attestato' }

interface Props { params: { id: string } }

export default async function AttestatoPage({ params }: Props) {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')

  const supabase = createServerClient()
  // La RLS limita la lettura ai propri attestati (o admin)
  const { data } = await supabase
    .from('certificates')
    .select('*, course:courses(*, instructor:instructors(*))')
    .eq('id', params.id)
    .single()

  if (!data) notFound()
  const cert = data as Certificate & { course: Course & { instructor: Instructor | null } }

  return (
    <div className="py-10">
      <div className="container-wide">
        <div className="flex items-center justify-between mb-8 print:hidden">
          <Link href="/dashboard/attestati" className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Tutti gli attestati
          </Link>
          <PrintButton />
        </div>

        {/* Attestato — A4 landscape in stampa */}
        <div
          id="certificate"
          className="mx-auto max-w-4xl aspect-[297/210] bg-surface border border-surface-border rounded-2xl p-14 flex flex-col print:rounded-none print:border-0 print:max-w-none print:aspect-auto print:h-full"
          style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center text-black">A</div>
              <span className="text-white">Academy</span>
            </div>
            <span className="text-sm text-muted">{cert.certificate_number}</span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-muted mb-6">Attestato di completamento</p>
            <h2 className="text-white mb-6">{profile.full_name}</h2>
            <p className="text-muted max-w-2xl">
              ha completato con successo il corso
            </p>
            <h4 className="text-white mt-3">{cert.course.title}</h4>
            {cert.course.instructor && (
              <p className="text-sm text-muted mt-4">Docente: {cert.course.instructor.full_name}</p>
            )}
          </div>

          <div className="flex items-end justify-between text-sm text-muted">
            <span>Emesso il {formatDate(cert.issued_at)}</span>
            <span>academy</span>
          </div>
        </div>
      </div>
    </div>
  )
}
