import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { Toaster } from 'sonner'
import Providers from './Providers'
import { getCourseFormats } from '@/lib/formats.server'

// Regola cliente: tutto il sito a font-weight 400 → carichiamo solo Regular.
// Gli altri pesi sono in src/fonts/, da riaggiungere qui se la regola cambia.
const aeonik = localFont({
  variable: '--font-aeonik',
  src: [
    { path: '../fonts/AeonikSoftTRIAL-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/AeonikSoftTRIAL-RegularItalic.woff2', weight: '400', style: 'italic' },
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
