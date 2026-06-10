import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: {
    default: 'Academy | La formazione per le Holding Italiane',
    template: '%s | Academy',
  },
  description:
    'La piattaforma di e-learning dedicata esclusivamente al network delle Holding italiane. Webinar, Masterclass, Fast Focus, Short Master e Executive Master.',
  keywords: ['holding', 'formazione', 'e-learning', 'webinar', 'masterclass', 'fiscale', 'governance'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className="dark">
      <body className={`${inter.variable} font-sans`}>
        {children}
        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{
            style: {
              background: '#1C1C1C',
              border: '1px solid #2A2A2A',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  )
}
