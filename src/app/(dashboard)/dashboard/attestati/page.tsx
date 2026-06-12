import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Award } from 'lucide-react'
import { createServerClient, getProfile } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import ClaimCertificateButton from './ClaimCertificateButton'
import type { Certificate, Course, CourseProgress, Enrollment } from '@/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Attestati' }

export default async function AttestatiPage() {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')

  const supabase = createServerClient()
  const [{ data: certificates }, { data: enrollments }, { data: progress }] = await Promise.all([
    supabase
      .from('certificates')
      .select('*, course:courses(id, title, slug)')
      .eq('user_id', profile.id)
      .order('issued_at', { ascending: false }),
    supabase
      .from('enrollments')
      .select('course_id, course:courses(id, title, slug, issues_certificate)')
      .eq('user_id', profile.id)
      .eq('status', 'active'),
    supabase
      .from('course_progress')
      .select('course_id, progress_percentage')
      .eq('user_id', profile.id),
  ])

  const certs = (certificates ?? []) as (Certificate & { course: Course })[]
  const certifiedCourseIds = new Set(certs.map((c) => c.course_id))
  const progressMap = new Map(
    (progress ?? []).map((p: Pick<CourseProgress, 'course_id' | 'progress_percentage'>) => [p.course_id, p.progress_percentage])
  )

  // Corsi completati al 100% che rilasciano attestato non ancora emesso
  const claimable = ((enrollments ?? []) as unknown as (Pick<Enrollment, 'course_id'> & { course: Course })[])
    .filter((e) =>
      e.course?.issues_certificate &&
      !certifiedCourseIds.has(e.course_id) &&
      (progressMap.get(e.course_id) ?? 0) === 100
    )

  return (
    <div className="py-10">
      <div className="container-wide">
        <div className="mb-10">
          <h1 className="font-bold text-white">Attestati</h1>
          <p className="text-white/50 mt-1">Gli attestati dei corsi che hai completato.</p>
        </div>

        {claimable.length > 0 && (
          <div className="mb-10 space-y-3">
            {claimable.map((e) => (
              <div key={e.course_id} className="card p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-white">{e.course.title}</p>
                  <p className="text-sm text-white/40 mt-0.5">Corso completato — il tuo attestato è pronto.</p>
                </div>
                <ClaimCertificateButton courseId={e.course_id} />
              </div>
            ))}
          </div>
        )}

        {certs.length === 0 && claimable.length === 0 ? (
          <div className="card p-12 text-center">
            <Award className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/50 mb-2">Non hai ancora attestati.</p>
            <p className="text-sm text-white/30">
              Completa al 100% un corso che rilascia attestati e lo troverai qui.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {certs.map((cert) => (
              <Link
                key={cert.id}
                href={`/dashboard/attestati/${cert.id}`}
                className="card p-6 hover:border-white/10 transition-colors group"
              >
                <Award className="w-8 h-8 text-white/40 mb-4" />
                <p className="text-white leading-snug group-hover:text-brand transition-colors">
                  {cert.course?.title}
                </p>
                <p className="text-sm text-white/40 mt-2">{cert.certificate_number}</p>
                <p className="text-xs text-white/30 mt-1">Emesso il {formatDate(cert.issued_at)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
