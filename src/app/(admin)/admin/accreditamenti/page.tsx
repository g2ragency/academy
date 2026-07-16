import { createServerClient } from '@/lib/supabase/server'
import TracciatoTable, { type TracciatoRow } from './TracciatoTable'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Accreditamenti' }

interface Props { searchParams: { corso?: string } }

/**
 * Area Accreditamenti (crediti FPC CNDCEC): per ogni corso accreditato mostra
 * chi ha maturato i crediti e permette di scaricare il tracciato a 9 colonne
 * da inviare all'Ordine. Non c'è integrazione: è un export manuale.
 */
export default async function AdminAccreditamentiPage({ searchParams }: Props) {
  const supabase = createServerClient()

  const { data: corsi } = await supabase
    .from('courses')
    .select('id, title, fpc_course_code, fpc_credits')
    .eq('fpc_accredited', true)
    .order('title')

  const corsoAttivo = searchParams.corso ?? corsi?.[0]?.id
  const { data: righe } = corsoAttivo
    ? await supabase.rpc('fpc_tracciato', { p_course_id: corsoAttivo })
    : { data: [] }

  return (
    <div className="px-10 py-8">
      <TracciatoTable
        corsi={corsi ?? []}
        corsoAttivo={corsoAttivo}
        rows={(righe ?? []) as TracciatoRow[]}
      />
    </div>
  )
}
