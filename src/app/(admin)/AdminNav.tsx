'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, Users, UserCheck, Tags, Award, Shapes, ArrowLeft, ShoppingBag, ExternalLink, Activity, Stamp } from 'lucide-react'

/** Ordini/rimborsi/pagamenti falliti sono gestiti su Stripe (link esterno). */
const STRIPE_ORDERS_URL = 'https://dashboard.stripe.com/payments'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/corsi', label: 'Corsi', icon: BookOpen },
  { href: '/admin/formati', label: 'Formati', icon: Shapes },
  { href: '/admin/docenti', label: 'Docenti', icon: UserCheck },
  { href: '/admin/tassonomie', label: 'Tassonomie', icon: Tags },
  { href: '/admin/attestati', label: 'Attestati', icon: Award },
  { href: '/admin/accreditamenti', label: 'Accreditamenti', icon: Stamp },
  { href: '/admin/andamento', label: 'Andamento', icon: Activity },
  { href: '/admin/utenti', label: 'Utenti', icon: Users },
]

const itemClass = (active: boolean) =>
  `flex items-center gap-3 h-[50px] px-4 rounded-[10px] text-[18px] leading-none transition-colors ${
    active ? 'bg-white/20 text-white' : 'text-muted hover:text-white hover:bg-white/10'
  }`

/** Nav admin (client): stessi stili della sidebar area riservata (Figma). */
export default function AdminNav() {
  const pathname = usePathname()
  return (
    <>
      <nav className="flex-1 p-4 space-y-1">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} className={itemClass(active)}>
              <item.icon className="w-6 h-6 shrink-0" />
              {item.label}
            </Link>
          )
        })}
        {/* Ordini gestiti su Stripe (rimborsi, pagamenti falliti, dispute) */}
        <a href={STRIPE_ORDERS_URL} target="_blank" rel="noopener noreferrer" className={itemClass(false)}>
          <ShoppingBag className="w-6 h-6 shrink-0" />
          <span className="flex-1">Ordini</span>
          <ExternalLink className="w-4 h-4 shrink-0 opacity-60" />
        </a>
      </nav>
      <div className="p-4 border-t border-surface-border">
        <Link href="/dashboard" className={itemClass(false)}>
          <ArrowLeft className="w-6 h-6 shrink-0" />
          Torna al sito
        </Link>
      </div>
    </>
  )
}
