'use client'

import { CartProvider } from '@/context/CartContext'
import { FormatsProvider } from '@/context/FormatsContext'
import CartDrawer from '@/components/cart/CartDrawer'
import type { CourseFormat } from '@/types'

/** Provider client globali (montati nel root layout, server). I formati sono
 *  fetchati lato server e passati come initial (disponibili anche in SSR). */
export default function Providers({ formats, children }: { formats: CourseFormat[]; children: React.ReactNode }) {
  return (
    <FormatsProvider formats={formats}>
      <CartProvider>
        {children}
        <CartDrawer />
      </CartProvider>
    </FormatsProvider>
  )
}
