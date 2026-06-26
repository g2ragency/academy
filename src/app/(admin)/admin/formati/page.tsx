import { getCourseFormats } from '@/lib/formats.server'
import FormatsManager from './FormatsManager'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Formati' }

export default async function FormatiPage() {
  const formats = await getCourseFormats()

  return (
    <div className="px-10 py-8">
      <div className="mb-8">
        <h1 className="text-white">Tipologie formative</h1>
        <p className="text-white/50 mt-1 max-w-2xl">
          I formati dei corsi (Webinar, Master, Convegni…). Crea, riordina e assegna un&apos;icona.
          Lo slug è la chiave referenziata dai corsi: un formato in uso non può essere eliminato.
        </p>
      </div>
      <FormatsManager initialFormats={formats} />
    </div>
  )
}
