'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import AvatarCropModal from '@/components/dashboard/AvatarCropModal'
import type { Profile } from '@/types'

const schema = z.object({
  first_name: z.string().min(1, 'Campo obbligatorio'),
  last_name: z.string().min(1, 'Campo obbligatorio'),
  bio: z.string().max(500).optional(),
  company: z.string().optional(),
  website: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function ProfiloPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [changingEmail, setChangingEmail] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setProfile(data)
        reset({
          first_name: data.first_name ?? '',
          last_name: data.last_name ?? '',
          bio: data.bio ?? '',
          company: data.company ?? '',
          website: data.website ?? '',
        })
      }
    }
    load()
  }, [supabase, reset])

  const onSubmit = async (data: FormData) => {
    if (!profile) return
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: data.first_name,
        last_name: data.last_name,
        full_name: `${data.first_name} ${data.last_name}`.trim(),
        bio: data.bio,
        company: data.company,
        website: data.website,
      })
      .eq('id', profile.id)

    if (error) toast.error('Errore nel salvataggio')
    else toast.success('Profilo aggiornato!')
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !profile) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Immagine troppo grande, massimo 10MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setPendingFile(file)
      setCropSrc(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Riapre il ritaglio partendo dall'originale salvato nello storage
  // (per gli avatar caricati prima di questa funzionalità ritaglia la versione pubblicata)
  const handleEditCrop = async () => {
    if (!profile) return
    const { data: files } = await supabase.storage.from('academy').list('avatars', { search: `${profile.id}.original` })
    const original = files?.[0]
    let src = profile.avatar_url
    if (original) {
      const { data } = supabase.storage.from('academy').getPublicUrl(`avatars/${original.name}`)
      src = `${data.publicUrl}?t=${Date.now()}`
    }
    if (!src) return
    setPendingFile(null)
    setCropSrc(src)
  }

  const handleCropConfirm = async (blob: Blob) => {
    if (!profile) return
    setAvatarUploading(true)
    try {
      const storage = supabase.storage.from('academy')
      const croppedPath = `avatars/${profile.id}.jpg`

      if (pendingFile) {
        // foto nuova: elimina i file precedenti dell'utente e salva l'originale per i ritagli futuri
        const { data: existing } = await storage.list('avatars', { search: profile.id })
        const stale = (existing ?? []).map((f) => `avatars/${f.name}`)
        if (stale.length) await storage.remove(stale)

        const ext = pendingFile.name.split('.').pop()?.toLowerCase() ?? 'jpg'
        const { error: originalError } = await storage.upload(`avatars/${profile.id}.original.${ext}`, pendingFile, { upsert: true })
        if (originalError) throw originalError
      }

      const { error: uploadError } = await storage.upload(croppedPath, blob, { upsert: true, contentType: 'image/jpeg' })
      if (uploadError) throw uploadError

      const { data: urlData } = storage.getPublicUrl(croppedPath)
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`
      const { error: dbError } = await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', profile.id)
      if (dbError) throw dbError

      setProfile({ ...profile, avatar_url: avatarUrl })
      window.dispatchEvent(new CustomEvent<string | null>('avatar-updated', { detail: avatarUrl }))
      setCropSrc(null)
      setPendingFile(null)
      toast.success('Immagine aggiornata!')
    } catch {
      toast.error('Errore nel caricamento immagine')
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!profile) return
    const storage = supabase.storage.from('academy')
    const { data: files } = await storage.list('avatars', { search: profile.id })
    if (files?.length) await storage.remove(files.map((f) => `avatars/${f.name}`))
    await supabase.from('profiles').update({ avatar_url: null }).eq('id', profile.id)
    setProfile({ ...profile, avatar_url: null })
    window.dispatchEvent(new CustomEvent<string | null>('avatar-updated', { detail: null }))
    toast.success('Immagine rimossa')
  }

  const handleChangeEmail = async () => {
    if (!newEmail) return
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    if (error) toast.error(error.message)
    else {
      toast.success('Controlla la tua email per confermare il cambio')
      setChangingEmail(false)
      setNewEmail('')
    }
  }

  if (!profile) return null

  return (
    <div className="px-10 py-8 max-w-3xl">
      <h5 className="text-white mb-8">Account</h5>

      <div className="border-b border-surface-border pb-8 mb-8">
        <p className="text-sm font-medium text-white/60 mb-4">Foto profilo</p>
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-surface-elevated border border-surface-border flex items-center justify-center overflow-hidden shrink-0">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-white/30" />
            )}
          </div>
          <div>
            <div className="flex gap-3 mb-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="px-4 py-2 text-sm font-medium text-white bg-surface-elevated border border-surface-border rounded-lg hover:border-white/30 transition-colors disabled:opacity-50"
              >
                {avatarUploading ? 'Caricamento...' : 'Carica Immagine'}
              </button>
              {profile.avatar_url && (
                <>
                  <button
                    onClick={handleEditCrop}
                    className="px-4 py-2 text-sm font-medium text-white bg-surface-elevated border border-surface-border rounded-lg hover:border-white/30 transition-colors"
                  >
                    Modifica ritaglio
                  </button>
                  <button
                    onClick={handleRemoveAvatar}
                    className="px-4 py-2 text-sm font-medium text-white bg-surface-elevated border border-surface-border rounded-lg hover:border-white/30 transition-colors"
                  >
                    Rimuovi
                  </button>
                </>
              )}
            </div>
            <p className="text-xs text-white/30">Supportiamo PNG, JPEG e GIF sotto i 10MB</p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
        </div>
      </div>

      {cropSrc && (
        <AvatarCropModal
          imageSrc={cropSrc}
          uploading={avatarUploading}
          onCancel={() => { setCropSrc(null); setPendingFile(null) }}
          onConfirm={handleCropConfirm}
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Nome</label>
            <input
              {...register('first_name')}
              placeholder="Mario"
              className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-brand/50 transition-colors"
            />
            {errors.first_name && <p className="text-xs text-red-400 mt-1">{errors.first_name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Cognome</label>
            <input
              {...register('last_name')}
              placeholder="Rossi"
              className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-brand/50 transition-colors"
            />
            {errors.last_name && <p className="text-xs text-red-400 mt-1">{errors.last_name.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">Email</label>
          <div className="flex gap-3">
            <input
              type="email"
              value={changingEmail ? newEmail : profile.email}
              onChange={(e) => changingEmail && setNewEmail(e.target.value)}
              readOnly={!changingEmail}
              className="flex-1 bg-surface-elevated border border-surface-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-brand/50 transition-colors read-only:opacity-60"
            />
            {changingEmail ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleChangeEmail}
                  className="px-4 py-2 text-sm font-medium text-black bg-white rounded-lg hover:bg-white/90 transition-colors"
                >
                  Conferma
                </button>
                <button
                  type="button"
                  onClick={() => { setChangingEmail(false); setNewEmail('') }}
                  className="px-4 py-2 text-sm font-medium text-white bg-surface-elevated border border-surface-border rounded-lg hover:border-white/30 transition-colors"
                >
                  Annulla
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setChangingEmail(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-surface-elevated border border-surface-border rounded-lg hover:border-white/30 transition-colors whitespace-nowrap"
              >
                Cambia Email
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">Su di te</label>
          <textarea
            {...register('bio')}
            rows={4}
            placeholder="Mario"
            className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-brand/50 transition-colors resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Azienda</label>
            <input
              {...register('company')}
              placeholder="Lorem Ipsum"
              className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-brand/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Sito web</label>
            <input
              {...register('website')}
              placeholder="www.rossi.it"
              className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-brand/50 transition-colors"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-medium text-black bg-white rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Salvataggio...' : 'Salva modifiche'}
          </button>
        </div>
      </form>
    </div>
  )
}
