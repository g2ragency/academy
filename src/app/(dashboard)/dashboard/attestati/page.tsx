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
      .select('course_id, course:courses(id, title, slug, issues_certificate, certificate_threshold_percent, fpc_accredited)')
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

  // Corsi che rilasciano attestato, non ancora emesso, divisi per soglia raggiunta
  const certCourses = ((enrollments ?? []) as unknown as (Pick<Enrollment, 'course_id'> & { course: Course })[])
    .filter((e) => e.course?.issues_certificate && !certifiedCourseIds.has(e.course_id))

  // Corsi accreditati FPC: la % di lezioni spuntate è il metro sbagliato — lì
  // decide il completamento VERIFICATO (tempo di visione dai log server-side).
  // Stessa fonte dell'attestato (issue_certificate), così ciò che la pagina
  // promette e ciò che la RPC concede non possono divergere.
  const accredited = certCourses.filter((e) => e.course.fpc_accredited)
  const verifiedStates = await Promise.all(
    accredited.map((e) => supabase.rpc('course_lesson_state', { p_course_id: e.course_id }))
  )
  const verifiedMap = new Map(
    accredited.map((e, i) => {
      const rows = (verifiedStates[i].data ?? []) as { verified: boolean }[]
      return [e.course_id, { done: rows.filter((r) => r.verified).length, total: rows.length }]
    })
  )

  const threshold = (c: Course) => c.certificate_threshold_percent ?? 80
  const isClaimable = (e: (typeof certCourses)[number]) => {
    if (e.course.fpc_accredited) {
      const v = verifiedMap.get(e.course_id)
      return !!v && v.total > 0 && v.done === v.total
    }
    return (progressMap.get(e.course_id) ?? 0) >= threshold(e.course)
  }
  // Sopra soglia → attestato ottenibile
  const claimable = certCourses.filter(isClaimable)
  // Sotto soglia → mostra quanto manca (per gli accreditati: contenuti verificati)
  const inProgress = certCourses
    .filter((e) => !isClaimable(e))
    .map((e) => {
      const v = e.course.fpc_accredited ? verifiedMap.get(e.course_id) : undefined
      return {
        ...e,
        progress: progressMap.get(e.course_id) ?? 0,
        soglia: threshold(e.course),
        verified: v ?? null,
      }
    })

  return (
    <div className="py-10">
      <div className="container-wide">
        <div className="mb-10">
          <h4 className="font-bold text-white">Attestati</h4>
          <p className="text-white/50 mt-1">Gli attestati dei corsi che hai completato.</p>
        </div>

        {claimable.length > 0 && (
          <div className="mb-6 space-y-3">
            {claimable.map((e) => (
              <div key={e.course_id} className="card p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-white">{e.course.title}</p>
                  <p className="text-sm text-white/40 mt-0.5">Soglia raggiunta — la tua attestazione è pronta.</p>
                </div>
                <ClaimCertificateButton courseId={e.course_id} />
              </div>
            ))}
          </div>
        )}

        {/* Corsi con attestato non ancora sbloccato: quanto manca alla soglia */}
        {inProgress.length > 0 && (
          <div className="mb-10 space-y-3">
            {inProgress.map((e) => (
              <div key={e.course_id} className="card p-5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-white truncate">{e.course.title}</p>
                  <p className="text-sm text-white/40 mt-0.5">
                    {e.verified
                      ? `Contenuti completati: ${e.verified.done} di ${e.verified.total} — corso accreditato, vale il tempo di visione effettivo.`
                      : `Sei al ${e.progress}% — ti manca il ${Math.max(0, e.soglia - e.progress)}% per raggiungere la soglia del ${e.soglia}%.`}
                  </p>
                </div>
                <span className="shrink-0 text-sm text-white/30 tabular-nums">
                  {e.verified ? `${e.verified.done}/${e.verified.total}` : `${e.progress}/${e.soglia}%`}
                </span>
              </div>
            ))}
          </div>
        )}

        {certs.length === 0 && claimable.length === 0 && inProgress.length === 0 ? (
          <div className="card p-12 text-center">
            <Award className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/50 mb-2">Non hai ancora attestazioni.</p>
            <p className="text-sm text-white/30">
              Raggiungi la soglia di completamento di un corso che rilascia attestazioni e la troverai qui.
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
