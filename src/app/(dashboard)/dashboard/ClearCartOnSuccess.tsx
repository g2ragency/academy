'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useCart } from '@/context/CartContext'

/** Svuota il carrello al ritorno da un pagamento riuscito (success_url ?enrolled=1) */
export default function ClearCartOnSuccess() {
  const params = useSearchParams()
  const { clear } = useCart()

  useEffect(() => {
    if (params.get('enrolled')) clear()
  }, [params, clear])

  return null
}
