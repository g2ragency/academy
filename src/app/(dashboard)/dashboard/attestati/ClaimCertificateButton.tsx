'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Award } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

export default function ClaimCertificateButton({ courseId }: { courseId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const claim = async () => {
    setLoading(true)
    const { data, error } = await supabase.rpc('issue_certificate', { p_course_id: courseId })
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Attestato emesso!')
    if (data?.id) router.push(`/dashboard/attestati/${data.id}`)
    router.refresh()
  }

  return (
    <Button onClick={claim} loading={loading} size="sm" className="gap-2 shrink-0">
      <Award className="w-4 h-4" />
      Ottieni attestato
    </Button>
  )
}
