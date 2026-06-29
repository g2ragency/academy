import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { Toaster } from 'sonner'
import Providers from './Providers'
import { getCourseFormats } from '@/lib/formats.server'

// Regola cliente: tutto il sito a font-weight 400 → di base solo Regular.
// Eccezione autorizzata: il Bold (700) serve per i prezzi delle card carrello
// (style={{fontWeight:700}} mirato). Senza questa faccia il browser farebbe
// un fake-bold sintetico. Gli altri pesi restano in src/fonts/.
const aeonik = localFont({
  variable: '--font-aeonik',
  src: [
    { path: '../fonts/AeonikSoftTRIAL-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/AeonikSoftTRIAL-RegularItalic.woff2', weight: '400', style: 'italic' },
    { path: '../fonts/AeonikSoftTRIAL-Bold.woff2', weight: '700', style: 'normal' },
  ],
})

export const metadata: Metadata = {
  title: {
    default: 'Academy | La formazione per le Holding Italiane',
    template: '%s | Academy',
  },
  description:
    'La piattaforma di e-learning dedicata esclusivamente al network delle Holding italiane. Webinar, Masterclass, Fast Focus, Short Master e Executive Master.',
  keywords: ['holding', 'formazione', 'e-learning', 'webinar', 'masterclass', 'fiscale', 'governance'],
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const formats = await getCourseFormats()
  return (
    <html lang="it" className="dark">
      <body className={`${aeonik.variable} font-sans`}>
        <Providers formats={formats}>{children}</Providers>
        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{
            style: {
              background: '#000000',
              border: '1px solid rgba(152, 152, 152, 0.25)',
              color: '#F4F3F3',
            },
          }}
        />
      </body>
    </html>
  )
}
