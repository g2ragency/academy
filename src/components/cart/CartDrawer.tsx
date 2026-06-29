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
      {/* Backdrop: chiude al click fuori. Su mobile il pannello è full-screen
          e lo copre del tutto → la chiusura passa dalla X nell'header. */}
      <div
        onClick={closeCart}
        className={`fixed inset-0 z-[55] ${isOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!isOpen}
      />

      {/* Pannello: full-screen mobile, drawer flottante ~700px desktop */}
      <aside
        className={`fixed inset-0 z-[60] flex flex-col bg-surface/50 backdrop-blur-[10px] border-surface-border transition-transform duration-300
          lg:inset-auto lg:top-[86px] lg:bottom-4 lg:right-4 lg:w-[474px] lg:max-w-[calc(100vw-2rem)] lg:border lg:rounded-[30px] ${
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-[calc(100%+1.5rem)]'
        }`}
        role="dialog"
        aria-label="Carrello"
        aria-hidden={!isOpen}
      >
        {/* Header: titolo + chiudi */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <span className="text-white text-[18px] lg:text-[32px] leading-none">Carrello</span>
          <button
            onClick={closeCart}
            aria-label="Chiudi carrello"
            className="text-muted hover:text-white transition-colors -mr-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="border-t border-surface-border mx-6" />

        {/* Lista corsi — 20px sotto la linea separatrice */}
        <div className="flex-1 overflow-y-auto px-6 pt-5">
          {items.length === 0 ? (
            <p className="text-muted py-8">Il carrello è vuoto.</p>
          ) : (
            <div className="divide-y divide-surface-border">
              {items.map((item) => {
                const thumb = getMediaUrl(item.thumbnail_url)
                return (
                  <div key={item.id} className="flex gap-[15px] py-[18px] first:pt-0">
                    <div className="w-[110px] h-[76px] lg:w-[130px] lg:h-[90px] rounded-[10px] overflow-hidden relative bg-surface-card shrink-0">
                      {thumb && <Image src={thumb} alt={item.title} fill className="object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0 h-[76px] lg:h-[90px] flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[16px] lg:text-[18px] leading-[20px] text-white line-clamp-2">{item.title}</p>
                        <button
                          onClick={() => removeItem(item.id)}
                          aria-label={`Rimuovi ${item.title}`}
                          className="text-muted hover:text-white transition-colors shrink-0 -mt-0.5"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {/* ponytail: weight 700 = eccezione autorizzata alla regola "tutto 400" (spec Figma prezzo carrello); faccia Bold caricata in layout.tsx */}
                      <p style={{ fontWeight: 700 }} className="text-[16px] lg:text-[18px] leading-[20px] text-white mt-auto">{formatPrice(item.price_cents)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Totale + Check out */}
        <div className="px-6 pb-6 pt-4 border-t border-surface-border">
          <div className="flex items-baseline justify-between mb-6">
            <span className="text-[18px] lg:text-[32px] leading-none text-white">Totale</span>
            <span className="text-[18px] lg:text-[32px] leading-none text-white">{totalCents > 0 ? formatPrice(totalCents) : '0,00 €'}</span>
          </div>
          <button
            onClick={goToCheckout}
            disabled={items.length === 0}
            className="btn-primary w-full h-[65px] text-[18px] lg:text-[22px] leading-none rounded-[20px] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Check out
          </button>
        </div>
      </aside>
    </>
  )
}
