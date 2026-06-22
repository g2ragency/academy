import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  Clock,
  BookOpen,
  Lock,
  Play,
  CheckCircle2,
  Users,
  GraduationCap,
  Download,
  MonitorSmartphone,
  WifiOff,
  Subtitles,
  Award,
} from 'lucide-react'
import { createServerClient, getProfile } from '@/lib/supabase/server'
import { TAXONOMY_PARAM_PREFIX } from '@/lib/taxonomy'
import { getMediaUrl } from '@/lib/media'
import { CourseTypeBadge } from '@/components/ui/Badge'
import CourseRowCard from '@/components/courses/CourseRowCard'
import { formatPrice, formatHours, formatSeconds } from '@/lib/utils'
import type { Course, Instructor, Module, Lesson, Term } from '@/types'
import EnrollButton from './EnrollButton'
import ExpandableText from '@/components/ui/ExpandableText'
import Collapsible from './Collapsible'
import SummaryAccordion from './SummaryAccordion'
import InstructorCarousel from './InstructorCarousel'

export const dynamic = 'force-dynamic'

interface Props { params: { slug: string } }

/** Slug della taxonomy delle chips "Per chi è pensato il corso" (seed in migration 008) */
const PER_CHI_SLUG = 'per-chi'

// Nessun filtro su status: la RLS mostra le bozze solo agli admin,
// così l'anteprima da /admin/corsi funziona anche prima della pubblicazione
async function getCourse(slug: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('courses')
    // Hint FK necessario: courses→instructors ha due percorsi (FK diretta e junction course_instructors)
    .select('*, instructor:instructors!courses_instructor_id_fkey(*), course_instructors(sort_order, instructor:instructors(*))')
    .eq('slug', slug)
    .single()
  return data
}

async function getModules(courseId: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('modules')
    .select('*, lessons(*)')
    .eq('course_id', courseId)
    .order('sort_order')
  return (data ?? []) as (Module & { lessons: Lesson[] })[]
}

/** Terms del corso con lo slug della tassonomia di appartenenza, per i badge linkabili */
async function getCourseTerms(courseId: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('course_terms')
    .select('term:terms(*, taxonomy:taxonomies(slug))')
    .eq('course_id', courseId)
  return (data ?? [])
    .map((row: any) => row.term)
    .filter(Boolean) as (Term & { taxonomy: { slug: string } })[]
}

async function getEnrollment(userId: string, courseId: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('enrollments')
    .select('id, status')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single()
  return data
}

/** Corsi più seguiti dagli altri utenti (view aggregata course_popularity), escluso il corrente */
async function getRelatedCourses(excludeId: string) {
  const supabase = createServerClient()
  const [{ data: courses }, { data: popularity }] = await Promise.all([
    supabase.from('courses').select('*').eq('status', 'published').neq('id', excludeId),
    supabase.from('course_popularity').select('*'),
  ])
  const counts = new Map<string, number>(
    (popularity ?? []).map((p: any) => [p.course_id, p.enrollment_count])
  )
  return ((courses ?? []) as Course[])
    .sort(
      (a, b) =>
        (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) || a.sort_order - b.sort_order
    )
    .slice(0, 4)
}

export async function generateMetadata({ params }: Props) {
  const course = await getCourse(params.slug)
  return { title: course?.title ?? 'Corso' }
}

export default async function CourseDetailPage({ params }: Props) {
  const course = await getCourse(params.slug)
  if (!course) notFound()

  const [modules, profile, courseTerms, relatedCourses] = await Promise.all([
    getModules(course.id),
    getProfile(),
    getCourseTerms(course.id),
    getRelatedCourses(course.id),
  ])

  const enrollment = profile ? await getEnrollment(profile.id, course.id) : null
  const isEnrolled = enrollment?.status === 'active'
  const totalLessons = modules.reduce((acc, m) => acc + (m.lessons?.length ?? 0), 0)

  // Relatori: junction course_instructors, fallback sul docente singolo legacy
  const relatori: Instructor[] = (course.course_instructors ?? [])
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
    .map((row: any) => row.instructor)
    .filter(Boolean)
  if (relatori.length === 0 && course.instructor) relatori.push(course.instructor)

  // Le chips "Per chi" hanno una sezione dedicata; gli altri terms vanno tra le targhette in alto
  const perChiTerms = courseTerms.filter((t) => t.taxonomy.slug === PER_CHI_SLUG)
  const otherTerms = courseTerms.filter((t) => t.taxonomy.slug !== PER_CHI_SLUG)

  const previewVideo = course.preview_video_url ? getMediaUrl(course.preview_video_url) : null
  const isEmbed = previewVideo ? /youtube\.com|youtu\.be|vimeo\.com/.test(previewVideo) : false
  const thumb = getMediaUrl(course.thumbnail_url)
  const programPdf = course.program_pdf_url ? getMediaUrl(course.program_pdf_url) : null

  const checklist = [
    { icon: WifiOff, label: 'Visualizzazione off-line' },
    { icon: MonitorSmartphone, label: 'Accesso da dispositivo mobile' },
    { icon: Subtitles, label: 'Sottotitoli' },
    ...(course.issues_certificate ? [{ icon: Award, label: 'Certificato di completamento' }] : []),
  ]

  // Video/foto in apertura: full-bleed su mobile (esce dal padding del
  // container), dentro la colonna sinistra su desktop con radius 30
  const videoBlock = (
    <div className="aspect-video bg-surface-elevated rounded-none md:rounded-[30px] overflow-hidden relative">
      {previewVideo && isEmbed ? (
        <iframe
          src={previewVideo}
          title={`Anteprima — ${course.title}`}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : previewVideo ? (
        <video
          src={previewVideo}
          controls
          poster={thumb ?? undefined}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : thumb ? (
        <Image src={thumb} alt={course.title} fill className="object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Play className="w-12 h-12 text-white/20" />
        </div>
      )}
    </div>
  )

  // Contenuti del Riepilogo (meta, prezzo, checklist, CTA): condivisi tra
  // accordion mobile e sticky sidebar desktop
  const summaryContent = (
    <>
      <ul className="space-y-3">
        {[
          ...(course.duration_minutes
            ? [{ icon: Clock, label: formatHours(course.duration_minutes) }]
            : []),
          {
            icon: GraduationCap,
            label: `${relatori.length} ${relatori.length === 1 ? 'docente' : 'docenti'}`,
          },
          { icon: BookOpen, label: `${totalLessons} ${totalLessons === 1 ? 'lezione' : 'lezioni'}` },
        ].map((row) => (
          <li key={row.label} className="flex items-center gap-3 text-sm text-white/70">
            <span className="w-8 h-8 rounded-[10px] bg-[#888888] flex items-center justify-center shrink-0">
              <row.icon className="w-4 h-4 text-white" />
            </span>
            {row.label}
          </li>
        ))}
      </ul>

      <div className="flex items-baseline gap-2 mt-6 pb-6 border-b border-surface-border">
        <span className="text-4xl text-white">{formatPrice(course.price_cents)}</span>
        {course.price_cents > 0 && <span className="text-xs text-muted">IVA Inclusa</span>}
      </div>

      <ul className="mt-6 space-y-2.5">
        {checklist.map((f) => (
          <li key={f.label} className="flex items-center gap-2.5 text-sm text-white/60">
            <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
            {f.label}
          </li>
        ))}
      </ul>

      <div className="mt-6">
        {isEnrolled ? (
          <Link
            href={`/dashboard/corsi/${course.slug}`}
            className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-3 rounded-[20px] backdrop-blur-[15px]"
          >
            <Play className="w-4 h-4" />
            Continua a studiare
          </Link>
        ) : (
          <EnrollButton course={course} isLoggedIn={!!profile} />
        )}
      </div>

      {programPdf && (
        <a
          href={programPdf}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
        >
          <Download className="w-4 h-4" />
          Scarica il programma
        </a>
      )}
    </>
  )

  const primaryRelator = relatori[0]

  return (
    <div className="min-h-screen bg-surface pt-16 lg:pt-24 pb-20 overflow-x-clip">
      {/* Mobile: video full-bleed in cima a tutto, sopra il container */}
      <div className="lg:hidden">{videoBlock}</div>

      <div className="container-wide mt-6 lg:mt-0">
        {course.status !== 'published' && (
          <div className="mb-8 px-4 py-3 rounded-xl bg-surface-elevated border border-surface-border text-muted text-sm">
            Anteprima {course.status === 'draft' ? 'bozza' : 'corso archiviato'} — questa pagina è
            visibile solo agli admin finché il corso non è pubblicato.
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Colonna contenuto */}
          <div className="min-w-0 lg:col-span-2">
            {/* Targhette */}
            <div className="flex flex-wrap items-center gap-2">
              <CourseTypeBadge type={course.type} />
              {otherTerms.map((term) => (
                <Link
                  key={term.id}
                  href={`/corsi?${TAXONOMY_PARAM_PREFIX}${term.taxonomy.slug}=${term.slug}`}
                  className="px-[18px] py-2 rounded-[10px] bg-card backdrop-blur-[15px] text-xs text-[#989898] hover:text-white transition-colors"
                >
                  {term.name}
                </Link>
              ))}
            </div>

            <h3 className="text-white mt-4 leading-tight">{course.title}</h3>

            {/* Sottotitolo "Un corso di X" — solo mobile (su desktop il nome
                docente compare nella sidebar/colonna sotto) */}
            {primaryRelator && (
              <p className="lg:hidden mt-3 text-sm text-muted">
                Un corso di{' '}
                <Link href={`/docenti/${primaryRelator.slug}`} className="text-white underline underline-offset-4">
                  {primaryRelator.full_name}
                </Link>
              </p>
            )}

            {/* Riepilogo del corso — accordion chiusa su mobile (sotto al
                titolo), invisibile su desktop (sostituito dalla sidebar) */}
            <div className="lg:hidden mt-6">
              <SummaryAccordion label="Riepilogo del corso">
                {summaryContent}
              </SummaryAccordion>
            </div>

            {/* Video — visibile solo da lg in su (su mobile è già in cima) */}
            <div className="hidden lg:block mt-8">{videoBlock}</div>

            {/* Per chi è pensato il corso */}
            {perChiTerms.length > 0 && (
              <section className="mt-10 lg:mt-12">
                <div className="border-t border-muted mb-10" />
                <h5 className="text-white mb-6">Per chi è pensato il corso</h5>
                {/* Mobile: carosello a tutta larghezza con fade nero a destra.
                    Desktop: flex-wrap (i chip vanno a capo). */}
                <div className="flex md:flex-wrap gap-3 overflow-x-auto md:overflow-visible scrollbar-hide -mx-5 px-5 md:mx-0 md:px-0 fade-x-right md:[mask-image:none] md:[-webkit-mask-image:none]">
                  {perChiTerms.map((term) => (
                    <Link
                      key={term.id}
                      href={`/corsi?${TAXONOMY_PARAM_PREFIX}${term.taxonomy.slug}=${term.slug}`}
                      className="shrink-0 flex items-center gap-2 px-[18px] py-4 rounded-[15px] bg-card backdrop-blur-[20px] text-sm text-white hover:text-white/70 transition-colors"
                    >
                      <Users className="w-4 h-4 text-muted" />
                      {term.name}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Gli argomenti trattati */}
            {course.topics && course.topics.length > 0 && (
              <section className="mt-10 lg:mt-12">
                <div className="border-t border-muted mb-10" />
                <h5 className="text-white mb-6">Gli argomenti trattati</h5>
                <Collapsible collapsedHeight={140}>
                  <ul className="space-y-3">
                    {course.topics.map((topic: string) => (
                      <li key={topic} className="flex gap-3 text-white/60 leading-relaxed">
                        <span className="text-muted shrink-0 mt-0.5">•</span>
                        {topic}
                      </li>
                    ))}
                  </ul>
                </Collapsible>
              </section>
            )}

            {/* Descrizione del corso */}
            {course.description && (
              <section className="mt-10 lg:mt-12">
                <div className="border-t border-muted mb-10" />
                <h5 className="text-white mb-6">Descrizione del corso</h5>
                <ExpandableText text={course.description} />
              </section>
            )}

            {/* Programma del corso (moduli/lezioni con anteprime) */}
            {modules.length > 0 && (
              <section className="mt-10 lg:mt-12">
                <div className="border-t border-muted mb-10" />
                <h5 className="text-white mb-6">Programma del corso</h5>
                <div className="space-y-3">
                  {modules.map((module) => (
                    <ModuleAccordion key={module.id} module={module} isEnrolled={isEnrolled} />
                  ))}
                </div>
              </section>
            )}

            {/* Relatori */}
            {relatori.length > 0 && (
              <section className="mt-10 lg:mt-12">
                <div className="border-t border-muted mb-10" />
                <InstructorCarousel instructors={relatori} />
              </section>
            )}
          </div>

          {/* Sidebar desktop — Riepilogo del corso (sticky, nascosta su mobile
              perché sostituita dall'accordion sotto il titolo) */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="rounded-[40px] bg-card p-6 sticky top-24">
              <h6 className="text-white mb-6">Riepilogo del corso</h6>
              {summaryContent}
            </div>
          </div>
        </div>

        {/* Gli altri utenti hanno seguito anche — max 4 card */}
        {relatedCourses.length > 0 && (
          <section className="mt-16">
            <div className="border-t border-muted mb-12" />
            <h5 className="text-white mb-8">Gli altri utenti hanno seguito anche</h5>
            <div className="space-y-2.5 sm:space-y-5">
              {relatedCourses.slice(0, 4).map((related) => (
                <CourseRowCard key={related.id} course={related} />
              ))}
            </div>

            {/* CTA: bottone pieno su mobile, link "Carica di più" su desktop */}
            <div className="mt-6 md:mt-8">
              <Link
                href="/corsi"
                className="md:hidden block w-full text-center bg-white text-black rounded-[10px] py-3 text-sm"
              >
                Scopri tutti i corsi
              </Link>
              <Link
                href="/corsi"
                className="hidden md:inline-flex w-full items-center justify-center gap-2 text-muted hover:text-white transition-colors"
              >
                Carica di più
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function ModuleAccordion({ module, isEnrolled }: { module: Module & { lessons: Lesson[] }; isEnrolled: boolean }) {
  const lessonCount = module.lessons?.length ?? 0
  return (
    <details className="card group">
      <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
        <div className="flex items-center gap-3">
          <span className="font-medium text-white text-sm">{module.title}</span>
          <span className="text-xs text-white/40">{lessonCount} lezioni</span>
        </div>
        <span className="text-white/40 text-xs">▾</span>
      </summary>
      <div className="border-t border-surface-border divide-y divide-surface-border">
        {module.lessons?.sort((a, b) => a.sort_order - b.sort_order).map((lesson) => (
          <div key={lesson.id} className="flex items-center gap-3 px-4 py-3">
            {isEnrolled || lesson.is_preview ? (
              <Play className="w-3.5 h-3.5 text-brand shrink-0" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-white/30 shrink-0" />
            )}
            <span className={`text-sm flex-1 ${isEnrolled || lesson.is_preview ? 'text-white/70' : 'text-white/40'}`}>
              {lesson.title}
              {lesson.is_preview && !isEnrolled && (
                <span className="ml-2 text-xs text-brand">Anteprima</span>
              )}
            </span>
            {lesson.duration_seconds && (
              <span className="text-xs text-white/30">{formatSeconds(lesson.duration_seconds)}</span>
            )}
          </div>
        ))}
      </div>
    </details>
  )
}
