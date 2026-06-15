'use client'

import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/context/CartContext'

/** Icona carrello in navbar: opaca quando vuoto, bianca con badge quando pieno */
export default function CartButton() {
  const { count, ready, openCart } = useCart()
  const hasItems = ready && count > 0

  return (
    <button
      onClick={openCart}
      aria-label={hasItems ? `Carrello (${count})` : 'Carrello vuoto'}
      className="relative p-2 transition-colors"
    >
      <ShoppingCart className={`w-5 h-5 ${hasItems ? 'text-white' : 'text-white/40'}`} />
      {hasItems && (
        <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-white text-black text-[10px] flex items-center justify-center">
          {count}
        </span>
      )}
    </button>
  )
}
