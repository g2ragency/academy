'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, BellOff } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  instructorId: string
  instructorSlug: string
  isLoggedIn: boolean
  initialFollowing: boolean
  initialNotify: boolean
}

export default function FollowButton({
  instructorId,
  instructorSlug,
  isLoggedIn,
  initialFollowing,
  initialNotify,
}: Props) {
  const router = useRouter()
  const [following, setFollowing] = useState(initialFollowing)
  const [notify, setNotify] = useState(initialNotify)
  const [loadingFollow, setLoadingFollow] = useState(false)
  const [loadingNotify, setLoadingNotify] = useState(false)

  const redirectToLogin = () =>
    router.push(`/auth/login?redirect=/docenti/${instructorSlug}`)

  const handleFollow = async () => {
    if (!isLoggedIn) { redirectToLogin(); return }
    setLoadingFollow(true)
    try {
      const res = await fetch(`/api/instructors/${instructorId}/follow`, { method: 'POST' })
      const data = await res.json()
      setFollowing(data.following)
      if (!data.following) setNotify(false)
      toast.success(data.following ? 'Docente seguito' : 'Non stai più seguendo il docente')
    } catch {
      toast.error('Si è verificato un errore')
    } finally {
      setLoadingFollow(false)
    }
  }

  const handleNotify = async () => {
    if (!isLoggedIn) { redirectToLogin(); return }
    setLoadingNotify(true)
    try {
      const res = await fetch(`/api/instructors/${instructorId}/notify`, { method: 'POST' })
      const data = await res.json()
      setFollowing(data.following)
      setNotify(data.notify)
      toast.success(data.notify ? 'Notifiche attivate' : 'Notifiche disattivate')
    } catch {
      toast.error('Si è verificato un errore')
    } finally {
      setLoadingNotify(false)
    }
  }

  return (
    <div className="flex items-center gap-2 ml-auto shrink-0">
      <button
        onClick={handleFollow}
        disabled={loadingFollow}
        className={`px-5 py-2 rounded-[15px] text-sm transition-colors disabled:opacity-50 ${
          following
            ? 'bg-[#1B1B1B] text-white border border-white/10'
            : 'bg-[#F4F3F3] text-black'
        }`}
      >
        {following ? 'Stai seguendo' : 'Segui'}
      </button>
      <button
        onClick={handleNotify}
        disabled={loadingNotify}
        aria-label={notify ? 'Disattiva notifiche' : 'Attiva notifiche'}
        className={`w-10 h-10 rounded-[15px] border flex items-center justify-center transition-colors disabled:opacity-50 ${
          notify
            ? 'bg-[#1B1B1B] border-white/10 text-white'
            : 'border-surface-border text-white/50 hover:text-white hover:border-white/30'
        }`}
      >
        {notify ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
      </button>
    </div>
  )
}
