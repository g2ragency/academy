'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { getMediaUrl } from '@/lib/media'
import { formatPrice } from '@/lib/utils'

/** Sidecart (design Figma): drawer da destra, lista corsi, totale, Check out */
export default function CartDrawer() {
  const { items, totalCents, isOpen, closeCart, removeItem } = useCart()
  const router = useRouter()

  const goToCheckout = () => {
    closeCart()
    router.push('/checkout')
  }

  return (
    <>
      {/* Backdrop trasparente: serve solo a chiudere al click fuori.
          Il dimming/blur lo fa il vetro del drawer (#00000080 + blur 10). */}
      <div
        onClick={closeCart}
        className={`fixed inset-0 z-40 ${isOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!isOpen}
      />

      {/* Pannello */}
      <aside
        className={`fixed top-16 bottom-0 right-0 z-40 w-[360px] max-w-[90vw] bg-surface/50 backdrop-blur-[10px] border-l border-y border-surface-border rounded-l-3xl flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="Carrello"
        aria-hidden={!isOpen}
      >
        <h5 className="text-white px-6 pt-6 pb-4">Carrello</h5>

        {/* Lista corsi */}
        <div className="flex-1 overflow-y-auto px-6 divide-y divide-surface-border">
          {items.length === 0 ? (
            <p className="text-muted text-sm py-8">Il carrello è vuoto.</p>
          ) : (
            items.map((item) => {
              const thumb = getMediaUrl(item.thumbnail_url)
              return (
                <div key={item.id} className="flex gap-3 py-4">
                  <div className="w-20 h-14 rounded-lg overflow-hidden relative bg-surface-card shrink-0">
                    {thumb && <Image src={thumb} alt={item.title} fill className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white leading-snug line-clamp-2 pr-5">{item.title}</p>
                    <p className="text-sm text-white mt-1">{formatPrice(item.price_cents)}</p>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    aria-label={`Rimuovi ${item.title}`}
                    className="text-muted hover:text-white transition-colors shrink-0 -mt-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Totale + Check out */}
        <div className="px-6 pb-6 pt-4 border-t border-surface-border">
          <div className="flex items-baseline justify-between mb-4">
            <span className="text-2xl text-white">Totale</span>
            <span className="text-2xl text-white">{totalCents > 0 ? formatPrice(totalCents) : '0,00 €'}</span>
          </div>
          <button
            onClick={goToCheckout}
            disabled={items.length === 0}
            className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Check out
          </button>
        </div>
      </aside>
    </>
  )
}
