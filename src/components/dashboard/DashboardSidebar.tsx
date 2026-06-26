'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
            className="w-full bg-surface border-[0.5px] border-white rounded-[10px] pl-9 pr-3 py-2 text-[14px] sm:text-[16px] leading-none text-white placeholder:text-muted focus:outline-none focus:border-white transition-colors"
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] sm:text-[16px] leading-none transition-colors mb-0.5 ${
                isActive
                  ? 'bg-surface-elevated text-white'
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
