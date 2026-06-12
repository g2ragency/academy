/**
 * Risoluzione URL dei media della piattaforma.
 *
 * Nel DB i campi media possono contenere:
 * - un URL assoluto (http/https): link esterni (YouTube, Vimeo) o URL legacy già salvati
 * - un path relativo nel bucket Storage (es. `courses/{id}/lessons/{id}/video.mp4`)
 *
 * Tutto il rendering passa da `getMediaUrl`: quando migreremo a un provider
 * video esterno (Bunny/Mux) o a un bucket privato con signed URL, basterà
 * cambiare questo file.
 */

/** Bucket pubblico: thumbnail corsi, avatar docenti/utenti */
export const MEDIA_BUCKET = 'academy'
/** Bucket privato: video e PDF delle lezioni (lettura via signed URL, RLS verifica l'enrollment) */
export const PROTECTED_BUCKET = 'academy-media'

/** Durata dei signed URL dei contenuti protetti (3 ore) */
export const SIGNED_URL_TTL_SECONDS = 60 * 60 * 3

export function isExternalUrl(value: string): boolean {
  return /^https?:\/\//i.test(value)
}

/** Risolve asset PUBBLICI (thumbnail, avatar). Per video/PDF lezioni usare getProtectedMediaUrl. */
export function getMediaUrl(value: string | null | undefined): string | null {
  if (!value) return null
  if (isExternalUrl(value)) return value
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${value}`
}

type SupabaseStorageClient = {
  storage: {
    from(bucket: string): {
      createSignedUrl(path: string, expiresIn: number): Promise<{ data: { signedUrl: string } | null; error: unknown }>
    }
  }
}

/**
 * Risolve i media protetti delle lezioni: URL esterni passano invariati,
 * i path nel bucket privato diventano signed URL generati con la sessione
 * dell'utente (la RLS storage nega l'accesso ai non iscritti).
 * Fallback sul bucket pubblico per i contenuti legacy caricati prima
 * dell'introduzione di `academy-media`.
 */
export async function getProtectedMediaUrl(
  supabase: SupabaseStorageClient,
  value: string | null | undefined
): Promise<string | null> {
  if (!value) return null
  if (isExternalUrl(value)) return value

  const { data } = await supabase.storage
    .from(PROTECTED_BUCKET)
    .createSignedUrl(value, SIGNED_URL_TTL_SECONDS)
  if (data?.signedUrl) return data.signedUrl

  return getMediaUrl(value)
}
