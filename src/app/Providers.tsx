'use client'

import { CartProvider } from '@/context/CartContext'
import CartDrawer from '@/components/cart/CartDrawer'

/** Provider client globali (montati nel root layout, server). */
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
      <CartDrawer />
    </CartProvider>
  )
}
