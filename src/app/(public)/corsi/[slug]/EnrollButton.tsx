'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LogIn } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useCart } from '@/context/CartContext'
import type { Course } from '@/types'

interface Props {
  course: Course
  isLoggedIn: boolean
}

export default function EnrollButton({ course, isLoggedIn }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { addItem, openCart, has } = useCart()
  const inCart = has(course.id)

  const handleClick = async () => {
    // Corso gratuito: iscrizione diretta (login richiesto)
    if (course.price_cents === 0) {
      if (!isLoggedIn) {
        router.push(`/auth/login?redirect=/corsi/${course.slug}`)
        return
      }
      setLoading(true)
      try {
        const res = await fetch('/api/enroll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId: course.id }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        toast.success('Iscrizione completata!')
        router.push(`/corsi/${course.slug}/guarda`)
        router.refresh()
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Si è verificato un errore')
      } finally {
        setLoading(false)
      }
      return
    }

    // Corso a pagamento: aggiunge al carrello (no login necessario) e apre il sidecart
    addItem({
      id: course.id,
      slug: course.slug,
      title: course.title,
      price_cents: course.price_cents,
      thumbnail_url: course.thumbnail_url,
    })
    openCart()
  }

  // Stile bottone Figma: alto 65px, testo 22px/100%, radius 20
  const ctaClass = 'w-full h-[65px] text-[22px] leading-none rounded-[20px]'

  if (course.price_cents === 0) {
    return (
      <Button onClick={handleClick} loading={loading} className={ctaClass} size="lg">
        {!isLoggedIn && <LogIn className="w-4 h-4" />}
        Iscriviti gratis
      </Button>
    )
  }

  if (inCart) {
    return (
      <Button onClick={openCart} className={ctaClass} size="lg">
        Vai al carrello
      </Button>
    )
  }

  return (
    <Button onClick={handleClick} className={`${ctaClass} backdrop-blur-[15px]`} size="lg">
      Acquista
    </Button>
  )
}
