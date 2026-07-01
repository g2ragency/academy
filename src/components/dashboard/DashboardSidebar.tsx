'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { ProfileIcon, FolderIcon, TeacherIcon, AwardBoxIcon, ClipboardIcon, GearIcon } from '@/components/icons/FigmaIcons'

const navItems = [
  { href: '/dashboard/profilo', label: 'Profilo', icon: ProfileIcon },
  { href: '/dashboard', label: 'Corsi', icon: FolderIcon, exact: true },
  { href: '/dashboard/docenti', label: 'Docenti preferiti', icon: TeacherIcon },
  { href: '/dashboard/attestati', label: 'Attestati', icon: AwardBoxIcon },
  { href: '/dashboard/acquisti', label: 'Acquisti e fatture', icon: ClipboardIcon },
  { href: '/dashboard/impostazioni', label: 'Impostazioni', icon: GearIcon },
]

export default function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [q, setQ] = useState(() => searchParams.get('q') ?? '')

  // Lesson player has its own full-screen layout
  if (pathname.includes('/lezione/')) return null

  // La ricerca porta ai propri corsi (/dashboard) filtrati per titolo
  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const v = q.trim()
    router.push(v ? `/dashboard?q=${encodeURIComponent(v)}` : '/dashboard')
  }

  return (
    <aside className="w-[300px] shrink-0 border-r border-surface-border flex flex-col h-full">
      <form onSubmit={onSearch} className="p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cerca"
            aria-label="Cerca nei tuoi corsi"
            className="w-full h-[50px] bg-surface border-[0.5px] border-white rounded-[10px] pl-12 pr-3 text-[18px] leading-none text-white placeholder:text-muted focus:outline-none focus:border-white transition-colors"
          />
        </div>
      </form>

      <nav className="flex-1 px-4 pb-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 h-[50px] px-4 rounded-[10px] text-[18px] leading-none transition-colors ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'text-muted hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="w-6 h-6 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
