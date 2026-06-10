'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ShoppingCart, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { Course } from '@/types'

interface Props {
  course: Course
  isLoggedIn: boolean
}

export default function EnrollButton({ course, isLoggedIn }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleEnroll = async () => {
    if (!isLoggedIn) {
      router.push(`/auth/login?redirect=/corsi/${course.slug}`)
      return
    }

    setLoading(true)
    try {
      if (course.price_cents === 0) {
        // Free course - enroll directly
        const res = await fetch('/api/enroll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId: course.id }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        toast.success('Iscrizione completata!')
        router.push(`/dashboard/corsi/${course.slug}`)
        router.refresh()
      } else {
        // Paid course - go to Stripe checkout
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId: course.id }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        window.location.href = data.url
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Si è verificato un errore')
    } finally {
      setLoading(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <Button onClick={handleEnroll} className="w-full" size="lg">
        <LogIn className="w-4 h-4" />
        Accedi per iscriverti
      </Button>
    )
  }

  return (
    <Button onClick={handleEnroll} loading={loading} className="w-full" size="lg">
      <ShoppingCart className="w-4 h-4" />
      {course.price_cents === 0 ? 'Iscriviti gratis' : `Acquista — ${(course.price_cents / 100).toFixed(0)}€`}
    </Button>
  )
}
