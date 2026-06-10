'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export default function DeleteCourseButton({ courseId, courseTitle }: { courseId: string; courseTitle: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    if (!confirm(`Sei sicuro di voler eliminare "${courseTitle}"? Questa azione non può essere annullata.`)) return
    setLoading(true)
    const { error } = await supabase.from('courses').delete().eq('id', courseId)
    if (error) {
      toast.error('Errore durante l\'eliminazione')
    } else {
      toast.success('Corso eliminato')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}
