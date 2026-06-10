'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, X, ChevronDown, User, LogOut, LayoutDashboard, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { label: 'Corsi', href: '/corsi' },
  { label: 'Docenti', href: '/docenti' },
]

const COURSE_TYPES = [
  { label: 'Webinar', href: '/corsi?tipo=webinar' },
  { label: 'Masterclass', href: '/corsi?tipo=masterclass' },
  { label: 'Fast Focus', href: '/corsi?tipo=fast_focus' },
  { label: 'Short Master', href: '/corsi?tipo=short_master' },
  { label: 'Executive Master', href: '/corsi?tipo=executive_master' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [coursesOpen, setCoursesOpen] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(data)
      }
    }
    loadProfile()

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setProfile(null)
      if (event === 'SIGNED_IN') loadProfile()
    })
    return () => listener.subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled || mobileOpen
          ? 'bg-surface/95 backdrop-blur-md border-b border-surface-border'
          : 'bg-transparent'
      )}
    >
      <div className="container-wide">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center font-bold text-black text-sm">
              A
            </div>
            <span className="font-bold text-white text-lg hidden sm:block">Academy</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {/* Corsi dropdown */}
            <div className="relative" onMouseEnter={() => setCoursesOpen(true)} onMouseLeave={() => setCoursesOpen(false)}>
              <button className={cn('flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors', pathname.startsWith('/corsi') ? 'text-white' : 'text-white/70 hover:text-white hover:bg-surface-elevated')}>
                Corsi <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', coursesOpen && 'rotate-180')} />
              </button>
              {coursesOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-surface-card border border-surface-border rounded-xl shadow-2xl overflow-hidden">
                  <div className="p-1">
                    <Link href="/corsi" className="block px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-surface-elevated rounded-lg transition-colors">
                      Tutti i corsi
                    </Link>
                    <div className="border-t border-surface-border my-1" />
                    {COURSE_TYPES.map((ct) => (
                      <Link key={ct.href} href={ct.href} className="block px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-surface-elevated rounded-lg transition-colors">
                        {ct.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/docenti"
              className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-colors', pathname === '/docenti' ? 'text-white' : 'text-white/70 hover:text-white hover:bg-surface-elevated')}
            >
              Docenti
            </Link>
          </div>

          {/* Right side */}
          <div className="hidden lg:flex items-center gap-3">
            {profile ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-elevated transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center text-brand font-semibold text-sm">
                    {profile.full_name?.[0]?.toUpperCase() ?? profile.email[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-white/80 max-w-[120px] truncate">
                    {profile.full_name ?? profile.email}
                  </span>
                  <ChevronDown className={cn('w-3.5 h-3.5 text-white/50 transition-transform', profileOpen && 'rotate-180')} />
                </button>

                {profileOpen && (
                  <div className="absolute top-full right-0 mt-1 w-52 bg-surface-card border border-surface-border rounded-xl shadow-2xl overflow-hidden">
                    <div className="p-1">
                      <Link href="/dashboard" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-surface-elevated rounded-lg">
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                      </Link>
                      <Link href="/dashboard/profilo" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-surface-elevated rounded-lg">
                        <User className="w-4 h-4" /> Profilo
                      </Link>
                      {profile.role === 'admin' && (
                        <>
                          <div className="border-t border-surface-border my-1" />
                          <Link href="/admin" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-brand hover:bg-brand/10 rounded-lg">
                            <Shield className="w-4 h-4" /> Area Admin
                          </Link>
                        </>
                      )}
                      <div className="border-t border-surface-border my-1" />
                      <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg">
                        <LogOut className="w-4 h-4" /> Esci
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/auth/login" className="btn-ghost text-sm py-2 px-4">
                  Accedi
                </Link>
                <Link href="/auth/registrati" className="btn-primary text-sm py-2 px-4">
                  Iscriviti
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-surface-elevated transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-surface-border py-4 space-y-1">
            <Link href="/corsi" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-surface-elevated rounded-lg">Tutti i corsi</Link>
            {COURSE_TYPES.map((ct) => (
              <Link key={ct.href} href={ct.href} onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 pl-8 text-sm text-white/60 hover:text-white hover:bg-surface-elevated rounded-lg">
                {ct.label}
              </Link>
            ))}
            <Link href="/docenti" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-surface-elevated rounded-lg">Docenti</Link>
            <div className="border-t border-surface-border pt-3 mt-3 flex flex-col gap-2 px-4">
              {profile ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="btn-secondary text-center text-sm py-2">Dashboard</Link>
                  {profile.role === 'admin' && (
                    <Link href="/admin" onClick={() => setMobileOpen(false)} className="text-center text-sm py-2 text-brand border border-brand/30 rounded-lg">Admin</Link>
                  )}
                  <button onClick={() => { handleSignOut(); setMobileOpen(false) }} className="text-sm text-red-400 py-2">Esci</button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="btn-secondary text-center text-sm py-2">Accedi</Link>
                  <Link href="/auth/registrati" onClick={() => setMobileOpen(false)} className="btn-primary text-center text-sm py-2">Iscriviti</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
