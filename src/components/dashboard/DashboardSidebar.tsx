'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  User, BookOpen, Award, CreditCard, Settings, Search, Heart
} from 'lucide-react'

const navItems = [
  { href: '/dashboard/profilo', label: 'Profilo', icon: User },
  { href: '/dashboard', label: 'Corsi', icon: BookOpen, exact: true },
  { href: '/dashboard/docenti', label: 'Docenti preferiti', icon: Heart },
  { href: '/dashboard/attestati', label: 'Attestati', icon: Award },
  { href: '/dashboard/acquisti', label: 'Acquisti e fatture', icon: CreditCard },
  { href: '/dashboard/impostazioni', label: 'Impostazioni', icon: Settings },
]

export default function DashboardSidebar() {
  const pathname = usePathname()

  // Lesson player has its own full-screen layout
  if (pathname.includes('/lezione/')) return null

  return (
    <aside className="w-64 shrink-0 border-r border-surface-border flex flex-col h-full">
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Cerca"
            className="w-full bg-surface-elevated border border-surface-border rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand/50 transition-colors"
          />
        </div>
      </div>

      <nav className="flex-1 px-2 pb-4">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors mb-0.5 ${
                isActive
                  ? 'bg-surface-elevated text-white font-medium'
                  : 'text-white/50 hover:text-white hover:bg-surface-elevated/50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
