import Link from 'next/link'
import { LayoutDashboard, BookOpen, Users, BarChart2, UserCheck, Settings } from 'lucide-react'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/corsi', label: 'Corsi', icon: BookOpen },
  { href: '/admin/docenti', label: 'Docenti', icon: UserCheck },
  { href: '/admin/utenti', label: 'Utenti', icon: Users },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-surface-border flex flex-col">
        <div className="p-5 border-b border-surface-border">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand rounded-lg flex items-center justify-center font-bold text-black text-xs">A</div>
            <span className="font-bold text-white text-sm">Admin</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-surface-elevated transition-colors"
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-surface-border">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/40 hover:text-white hover:bg-surface-elevated transition-colors">
            <Settings className="w-4 h-4" />
            Torna al sito
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
