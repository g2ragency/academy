import { createClient } from '@supabase/supabase-js'
import type { CourseFormat } from '@/types'

// Client pubblico anon, SENZA cookie. La tabella course_formats ha lettura
// pubblica via RLS, quindi non serve l'auth. Importante: questa funzione è
// chiamata nel root layout (quindi su ogni pagina). Usare il client basato sui
// cookie qui faceva crashare la static generation in build: l'init di GoTrue
// legge i cookie e lancia DynamicServerError come unhandled rejection.
const publicClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
)

/** Tipologie formative (course_formats) ordinate, lettura pubblica. */
export async function getCourseFormats(): Promise<CourseFormat[]> {
  const { data } = await publicClient
    .from('course_formats')
    .select('*')
    .order('sort_order')
  return (data ?? []) as CourseFormat[]
}
