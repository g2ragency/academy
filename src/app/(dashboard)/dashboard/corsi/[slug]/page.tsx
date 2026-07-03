import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

/** La visualizzazione del corso è stata spostata fuori dall'area riservata,
 *  in una pagina a parte con il layout della pagina-corso pubblica.
 *  Manteniamo un redirect per i vecchi link/bookmark. */
export default function LegacyCoursePlayerRedirect({ params }: { params: { slug: string } }) {
  redirect(`/corsi/${params.slug}/guarda`)
}
