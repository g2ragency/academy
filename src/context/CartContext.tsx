'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

/** Snapshot del corso salvato nel carrello (solo per il display: il prezzo
 *  autorevole viene riletto lato server al checkout, mai fidarsi del client). */
export interface CartItem {
  id: string
  slug: string
  title: string
  price_cents: number
  thumbnail_url: string | null
}

interface CartContextValue {
  items: CartItem[]
  count: number
  totalCents: number
  isOpen: boolean
  /** true dopo il mount: usare per evitare mismatch SSR sul badge */
  ready: boolean
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  clear: () => void
  has: (id: string) => boolean
  openCart: () => void
  closeCart: () => void
}

const STORAGE_KEY = 'academy-cart'

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [ready, setReady] = useState(false)

  // Carica il carrello da localStorage al mount (solo client)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setItems(JSON.parse(raw) as CartItem[])
    } catch {
      // storage non disponibile / JSON corrotto: si parte da carrello vuoto
    }
    setReady(true)
  }, [])

  // Persiste a ogni modifica (dopo il primo load)
  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // storage pieno/negato: ignora, il carrello resta in memoria
    }
  }, [items, ready])

  // Sincronizza tra schede aperte
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setItems(JSON.parse(e.newValue) as CartItem[])
        } catch {
          /* ignora valori corrotti */
        }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => (prev.some((i) => i.id === item.id) ? prev : [...prev, item]))
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const clear = useCallback(() => setItems([]), [])
  const has = useCallback((id: string) => items.some((i) => i.id === id), [items])

  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])

  const totalCents = items.reduce((sum, i) => sum + i.price_cents, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        count: items.length,
        totalCents,
        isOpen,
        ready,
        addItem,
        removeItem,
        clear,
        has,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart deve essere usato dentro <CartProvider>')
  return ctx
}
