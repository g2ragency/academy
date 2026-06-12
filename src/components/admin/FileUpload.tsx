'use client'

import { useState } from 'react'
import { Upload, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { MEDIA_BUCKET } from '@/lib/media'

interface Props {
  /** es. "image/*", "video/*", ".pdf" */
  accept: string
  maxSizeMB: number
  /** Path nel bucket, valutato al momento dell'upload. Return null per annullare (con messaggio già mostrato). */
  buildPath: (file: File) => string | null
  /** Bucket di destinazione: default `academy` (pubblico); usare `academy-media` per i contenuti protetti delle lezioni */
  bucket?: string
  /** Nome file attualmente associato, mostrato come stato iniziale */
  currentName?: string | null
  label?: string
  onUploaded: (result: { path: string; publicUrl: string; file: File }) => void
}

/**
 * Upload immediato verso Supabase Storage con validazione dimensione.
 * Limiti consigliati: immagini 2MB, PDF 10MB, video 50MB (limite per-file Supabase free tier).
 */
export default function FileUpload({ accept, maxSizeMB, buildPath, bucket = MEDIA_BUCKET, currentName, label, onUploaded }: Props) {
  const [uploading, setUploading] = useState(false)
  const [uploadedName, setUploadedName] = useState<string | null>(null)
  const supabase = createClient()

  const handleFile = async (file: File | undefined) => {
    if (!file) return

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File troppo grande: massimo ${maxSizeMB} MB`)
      return
    }

    const path = buildPath(file)
    if (!path) return

    setUploading(true)
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true })
    setUploading(false)

    if (error) {
      toast.error(`Errore upload: ${error.message}`)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
    setUploadedName(file.name)
    onUploaded({ path, publicUrl, file })
  }

  const displayName = uploadedName ?? currentName

  return (
    <label className="flex items-center gap-3 border border-dashed border-surface-border rounded-xl p-4 cursor-pointer hover:border-brand/40 transition-colors">
      {uploading ? (
        <Loader2 className="w-5 h-5 text-white/30 animate-spin shrink-0" />
      ) : uploadedName ? (
        <CheckCircle2 className="w-5 h-5 text-white/60 shrink-0" />
      ) : (
        <Upload className="w-5 h-5 text-white/30 shrink-0" />
      )}
      <span className="text-sm text-white/40 truncate">
        {uploading ? 'Caricamento…' : displayName ?? (label ?? `Carica file (max ${maxSizeMB} MB)`)}
      </span>
      <input
        type="file"
        accept={accept}
        className="hidden"
        disabled={uploading}
        onChange={(e) => {
          handleFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </label>
  )
}
