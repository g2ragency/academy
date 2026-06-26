'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import {
  X, ChevronDown, User, LogOut, LayoutDashboard, Shield, Search,
  Presentation, GraduationCap, Zap, Briefcase, ShieldCheck, BookOpen, Tag,
} from 'lucide-react'
import HamburgerIcon from '@/components/icons/HamburgerIcon'
import { createClient } from '@/lib/supabase/client'
import CartButton from '@/components/cart/CartButton'
import { useCart } from '@/context/CartContext'
import { buildTermTree, TAXONOMY_PARAM_PREFIX } from '@/lib/taxonomy'
import type { Profile, Taxonomy } from '@/types'
import { cn } from '@/lib/utils'
import LogoWithName from '@/components/icons/LogoWithName'
import LogoIcon from '@/components/icons/LogoIcon'
import UserIcon from '@/components/icons/UserIcon'

interface MenuItem {
  icon: React.ElementType
  label: string
  href: string
}

const COURSE_ITEMS: MenuItem[] = [
  { icon: BookOpen, label: 'Tutti i corsi', href: '/corsi' },
  { icon: Presentation, label: 'Webinar', href: '/corsi?tipo=webinar' },
  { icon: GraduationCap, label: 'Masterclass', href: '/corsi?tipo=masterclass' },
  { icon: Zap, label: 'Fast Focus', href: '/corsi?tipo=fast_focus' },
  { icon: Briefcase, label: 'Short Master', href: '/corsi?tipo=short_master' },
  { icon: ShieldCheck, label: 'Executive Master', href: '/corsi?tipo=executive_master' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  /** Dropdown del menu centrale aperto ('corsi' | slug taxonomy | null) */
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([])
  const searchInputRef = useRef<HTMLInputElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const pathname = usePathname()
  const router = useRouter()
  const { isOpen: cartOpen, closeCart } = useCart()
  // Istanza stabile: se ricreato a ogni render, lo useEffect con dep [supabase] rifetcha in loop
  const [supabase] = useState(() => createClient())

  // Sidecart e menu account sono mutuamente esclusivi: se si apre il carrello, chiudi il profilo
  useEffect(() => {
    if (cartOpen) setProfileOpen(false)
  }, [cartOpen])

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

  // Menu dinamici dalle tassonomie create dall'admin (es. Argomenti, Per chi)
  useEffect(() => {
    const loadTaxonomies = async () => {
      const { data } = await supabase
        .from('taxonomies')
        .select('*, terms(*)')
        .eq('show_in_filters', true)
        .eq('applies_to_courses', true)
        .order('sort_order')
      setTaxonomies((data ?? []) as Taxonomy[])
    }
    loadTaxonomies()
  }, [supabase])

  // Aggiorna il tondo in tempo reale quando l'utente cambia foto da /dashboard/profilo
  useEffect(() => {
    const onAvatarUpdated = (e: Event) => {
      const url = (e as CustomEvent<string | null>).detail
      setProfile((p) => (p ? { ...p, avatar_url: url } : p))
    }
    window.addEventListener('avatar-updated', onAvatarUpdated)
    return () => window.removeEventListener('avatar-updated', onAvatarUpdated)
  }, [])

  // Chiude dropdown e barra di ricerca a ogni cambio pagina
  useEffect(() => {
    setOpenMenu(null)
    setSearchOpen(false)
    setMobileOpen(false)
    setProfileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus()
  }, [searchOpen])

  // Chiude dropdown/ricerca cliccando fuori dalla navbar
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
        setOpenMenu(null)
        setSearchOpen(false)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setSearchOpen(false)
    setQuery('')
    router.push(`/corsi?q=${encodeURIComponent(q)}`)
  }

  /** Voci dropdown di una taxonomy: terms di primo livello → filtro corsi */
  const taxonomyItems = (taxonomy: Taxonomy): MenuItem[] =>
    buildTermTree(taxonomy.terms ?? []).map((term) => ({
      icon: Tag,
      label: term.name,
      href: `/corsi?${TAXONOMY_PARAM_PREFIX}${taxonomy.slug}=${term.slug}`,
    }))

  return (
    <nav
      ref={navRef}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled || mobileOpen || searchOpen
          ? 'bg-surface/50 backdrop-blur-[10px] border-b border-surface-border'
          : 'bg-transparent'
      )}
    >
      <div className="container-wide">
        <div className="flex items-center justify-between h-[50px] lg:h-[70px]">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0" aria-label="Academy">
            <LogoIcon className="h-[34px] w-auto text-white lg:hidden" />
            <LogoWithName className="hidden lg:block h-[40px] w-auto text-white" />
          </Link>

          {/* Menu centrale (design Figma): Corsi + tassonomie dinamiche + In tendenza + Cerca */}
          <div className="hidden lg:flex items-center gap-1" onMouseLeave={() => setOpenMenu(null)}>
            <NavDropdown
              label="Corsi"
              items={COURSE_ITEMS}
              open={openMenu === 'corsi'}
              onOpen={() => setOpenMenu('corsi')}
              active={pathname.startsWith('/corsi')}
            />

            {taxonomies.map((taxonomy) => {
              const items = taxonomyItems(taxonomy)
              if (items.length === 0) return null
              return (
                <NavDropdown
                  key={taxonomy.id}
                  label={taxonomy.name}
                  items={items}
                  open={openMenu === taxonomy.slug}
                  onOpen={() => setOpenMenu(taxonomy.slug)}
                />
              )
            })}

            <Link
              href="/#trending"
              className="px-4 py-2 rounded-lg text-[18px] leading-none text-white/70 hover:text-white transition-colors"
            >
              In tendenza
            </Link>

            <button
              onClick={() => setSearchOpen((v) => !v)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-lg text-[18px] leading-none transition-colors',
                searchOpen ? 'text-white' : 'text-white/70 hover:text-white'
              )}
            >
              Cerca
            </button>
          </div>

          {/* Right side */}
          <div className="hidden lg:flex items-center gap-3">
            {profile ? (
              <div className="relative">
                <button
                  onClick={() => { closeCart(); setProfileOpen((o) => !o) }}
                  className="block rounded-full hover:ring-2 hover:ring-white/20 transition-shadow"
                  aria-label="Menu profilo"
                >
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name ?? profile.email}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-12 h-12" />
                  )}
                </button>

                {profileOpen && (
                  <div className="absolute top-full right-0 mt-1 w-52 bg-surface/50 backdrop-blur-[10px] border border-surface-border rounded-xl shadow-2xl overflow-hidden">
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
                <Link
                  href="/auth/login"
                  className="flex items-center justify-center h-[45px] min-w-[95px] px-5 rounded-[15px] border border-white/40 text-[18px] leading-none text-white hover:border-white transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/auth/registrati"
                  className="flex items-center justify-center h-[45px] min-w-[95px] px-5 rounded-[15px] bg-white text-[18px] leading-none text-black hover:bg-white/80 transition-colors"
                >
                  Iscriviti
                </Link>
              </>
            )}
            <CartButton />
          </div>

          {/* Mobile: carrello + login (se non loggato) + hamburger */}
          <div className="lg:hidden flex items-center gap-2">
            <CartButton />
            {!profile && (
              <Link
                href="/auth/login"
                className="flex items-center justify-center h-[30px] w-[75px] rounded-[10px] bg-white text-[16px] leading-none text-black"
              >
                Log In
              </Link>
            )}
            <button
              className="p-2 rounded-lg hover:bg-surface-elevated transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <HamburgerIcon className="text-white" />}
            </button>
          </div>
        </div>

        {/* Barra di ricerca (desktop, sotto la nav) */}
        {searchOpen && (
          <form onSubmit={submitSearch} className="hidden lg:flex justify-center pb-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                ref={searchInputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cerca corsi"
                className="w-full bg-surface-elevated border border-surface-border rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>
          </form>
        )}

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-surface-border py-4 space-y-1 max-h-[calc(100vh-50px)] overflow-y-auto">
            <form onSubmit={submitSearch} className="px-4 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cerca corsi"
                  className="w-full bg-surface-elevated border border-surface-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/30"
                />
              </div>
            </form>

            <p className="px-4 pt-1 pb-1 text-xs text-white/40 uppercase tracking-wider">Corsi</p>
            {COURSE_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-surface-elevated rounded-lg">
                {item.label}
              </Link>
            ))}

            {taxonomies.map((taxonomy) => {
              const items = taxonomyItems(taxonomy)
              if (items.length === 0) return null
              return (
                <div key={taxonomy.id}>
                  <p className="px-4 pt-3 pb-1 text-xs text-white/40 uppercase tracking-wider">{taxonomy.name}</p>
                  {items.map((item) => (
                    <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-surface-elevated rounded-lg">
                      {item.label}
                    </Link>
                  ))}
                </div>
              )
            })}

            <Link href="/#trending" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-surface-elevated rounded-lg">
              In tendenza
            </Link>

            <div className="border-t border-surface-border pt-3 mt-3 flex flex-wrap gap-2 px-4">
              {profile ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center justify-center h-[30px] min-w-[74px] px-4 rounded-[10px] border border-white/40 text-[16px] leading-none text-white">Dashboard</Link>
                  {profile.role === 'admin' && (
                    <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center justify-center h-[30px] min-w-[74px] px-4 rounded-[10px] border border-brand/30 text-[16px] leading-none text-brand">Admin</Link>
                  )}
                  <button onClick={() => { handleSignOut(); setMobileOpen(false) }} className="flex items-center justify-center h-[30px] px-4 text-[16px] leading-none text-red-400">Esci</button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="flex items-center justify-center h-[30px] min-w-[74px] px-4 rounded-[10px] border border-white/40 text-[16px] leading-none text-white">Log In</Link>
                  <Link href="/auth/registrati" onClick={() => setMobileOpen(false)} className="flex items-center justify-center h-[30px] min-w-[74px] px-4 rounded-[10px] bg-white text-[16px] leading-none text-black">Iscriviti</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

/** Dropdown del menu centrale (design Figma): pannello scuro, icona in quadrotto + label */
function NavDropdown({ label, items, open, onOpen, active }: {
  label: string
  items: MenuItem[]
  open: boolean
  onOpen: () => void
  active?: boolean
}) {
  return (
    <div className="relative" onMouseEnter={onOpen}>
      <button
        onClick={onOpen}
        className={cn(
          'flex items-center gap-1 px-4 py-2 rounded-lg text-[18px] leading-none transition-colors',
          active || open ? 'text-white' : 'text-white/70 hover:text-white'
        )}
      >
        {label} <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        // pt-2 (non mt-2): il padding fa da "ponte" hoverable tra bottone e
        // pannello, così muovendo il mouse sulle voci il menu non si chiude
        <div className="absolute top-full left-0 pt-2 w-72">
          <div
            className="backdrop-blur-[20px] rounded-[30px] shadow-2xl"
            style={{ background: '#00000080', border: '0.5px solid #F4F3F3' }}
          >
            <div className="p-6">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-[10px] py-2 text-[18px] leading-none text-white hover:text-white/70 rounded-xl transition-colors group"
                >
                  <span className="w-[35px] h-[35px] rounded-[10px] bg-[#888888] flex items-center justify-center shrink-0 group-hover:bg-white transition-colors">
                    <item.icon className="w-6 h-6 text-black" />
                  </span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
