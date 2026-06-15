import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(cents: number): string {
  if (cents === 0) return 'Gratuito'
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100)
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

/** Durata stile card ("2 ore", "1 ora"); sotto l'ora restano i minuti */
export function formatHours(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.round(minutes / 60)
  return `${h} ${h === 1 ? 'ora' : 'ore'}`
}

export function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('it-IT', { dateStyle: 'long' }).format(new Date(iso))
}

/**
 * Sanifica un parametro di redirect: accetta SOLO path interni (evita open
 * redirect verso domini esterni). Deve iniziare con '/' ma non con '//'
 * o '/\' (URL protocol-relative che porterebbero fuori dal sito).
 */
export function safeRedirect(path: string | null | undefined, fallback = '/dashboard'): string {
  if (!path || typeof path !== 'string') return fallback
  if (!path.startsWith('/')) return fallback
  if (path.startsWith('//') || path.startsWith('/\\')) return fallback
  return path
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
