'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import BellIcon from '@/components/icons/BellIcon'
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
    <div className="flex items-center gap-2 shrink-0">
      {/* Segui: ~70px × ~30px su mobile, 175px × 50px su desktop */}
      <button
        onClick={handleFollow}
        disabled={loadingFollow}
        style={{ backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)' }}
        className={`w-[clamp(60px,18vw,70px)] sm:w-[175px] h-[clamp(26px,8vw,30px)] sm:h-[50px] rounded-[8px] sm:rounded-[15px] text-[14px] sm:text-[22px] leading-none transition-colors disabled:opacity-50 ${
          following
            ? 'bg-card text-white border border-white/10'
            : 'bg-[#F4F3F3] text-black'
        }`}
      >
        {following ? 'Stai seguendo' : 'Segui'}
      </button>
      {/* Campanella: ~30×30 su mobile, 50×50 su desktop */}
      <button
        onClick={handleNotify}
        disabled={loadingNotify}
        aria-label={notify ? 'Disattiva notifiche' : 'Attiva notifiche'}
        style={{ backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)' }}
        className={`w-[clamp(26px,8vw,30px)] sm:w-[50px] h-[clamp(26px,8vw,30px)] sm:h-[50px] shrink-0 rounded-[8px] sm:rounded-[15px] flex items-center justify-center transition-colors disabled:opacity-50 ${
          notify
            ? 'bg-card text-white'
            : 'bg-[#F4F3F3] text-black hover:opacity-80'
        }`}
      >
        <BellIcon className="w-5 h-5 sm:w-8 sm:h-8" />
      </button>
    </div>
  )
}
