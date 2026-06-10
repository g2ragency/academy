import Link from 'next/link'
import { Mail, Linkedin, Instagram } from 'lucide-react'

const FOOTER_LINKS = {
  Formazione: [
    { label: 'Webinar', href: '/corsi?tipo=webinar' },
    { label: 'Masterclass', href: '/corsi?tipo=masterclass' },
    { label: 'Fast Focus', href: '/corsi?tipo=fast_focus' },
    { label: 'Short Master', href: '/corsi?tipo=short_master' },
    { label: 'Executive Master', href: '/corsi?tipo=executive_master' },
  ],
  Piattaforma: [
    { label: 'Tutti i corsi', href: '/corsi' },
    { label: 'I nostri docenti', href: '/docenti' },
    { label: 'Area riservata', href: '/dashboard' },
    { label: 'Accedi', href: '/auth/login' },
  ],
  Legale: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Termini di servizio', href: '/termini' },
    { label: 'Cookie Policy', href: '/cookie' },
  ],
}

export default function Footer() {
  return (
    <footer className="border-t border-surface-border bg-surface">
      <div className="container-wide py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center font-bold text-black text-sm">A</div>
              <span className="font-bold text-white text-lg">Academy</span>
            </Link>
            <p className="text-sm text-white/50 leading-relaxed mb-6">
              La piattaforma di formazione dedicata esclusivamente al network delle Holding italiane.
            </p>
            <div className="flex items-center gap-3">
              <a href="mailto:info@academy.it" className="p-2 rounded-lg bg-surface-elevated hover:bg-surface-card border border-surface-border transition-colors" aria-label="Email">
                <Mail className="w-4 h-4 text-white/60" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-surface-elevated hover:bg-surface-card border border-surface-border transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-4 h-4 text-white/60" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-surface-elevated hover:bg-surface-card border border-surface-border transition-colors" aria-label="Instagram">
                <Instagram className="w-4 h-4 text-white/60" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-white mb-4">{title}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-white/50 hover:text-white/80 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-surface-border mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} Academy. Tutti i diritti riservati.
          </p>
          <p className="text-xs text-white/30">
            La formazione per le Holding Italiane
          </p>
        </div>
      </div>
    </footer>
  )
}
