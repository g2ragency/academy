'use client'

import { useState } from 'react'
import Cropper, { Area } from 'react-easy-crop'
import { ZoomIn, ZoomOut } from 'lucide-react'

interface AvatarCropModalProps {
  imageSrc: string
  uploading: boolean
  onCancel: () => void
  onConfirm: (blob: Blob) => void
}

export default function AvatarCropModal({ imageSrc, uploading, onCancel, onConfirm }: AvatarCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [areaPixels, setAreaPixels] = useState<Area | null>(null)
  const [error, setError] = useState(false)

  const handleConfirm = async () => {
    if (!areaPixels) return
    try {
      const blob = await createCroppedBlob(imageSrc, areaPixels)
      onConfirm(blob)
    } catch {
      setError(true)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface/50 backdrop-blur-[10px] border border-surface-border rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-surface-border">
          <h2 className="font-semibold text-white">Ritaglia la foto profilo</h2>
          <p className="text-xs text-white/40 mt-1">Trascina per riposizionare, usa lo slider per lo zoom</p>
        </div>

        <div className="relative w-full h-80 bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setAreaPixels(pixels)}
          />
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-white/40 shrink-0" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-brand"
            />
            <ZoomIn className="w-4 h-4 text-white/40 shrink-0" />
          </div>

          {error && <p className="text-xs text-red-400">Impossibile elaborare l&apos;immagine, riprova.</p>}

          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              disabled={uploading}
              className="px-4 py-2 text-sm font-medium text-white bg-surface-elevated border border-surface-border rounded-lg hover:border-white/30 transition-colors disabled:opacity-50"
            >
              Annulla
            </button>
            <button
              onClick={handleConfirm}
              disabled={uploading || !areaPixels}
              className="px-4 py-2 text-sm font-medium text-black bg-white rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              {uploading ? 'Salvataggio...' : 'Salva'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const OUTPUT_SIZE = 512

async function createCroppedBlob(src: string, area: Area): Promise<Blob> {
  const img = await loadImage(src)
  const canvas = document.createElement('canvas')
  canvas.width = OUTPUT_SIZE
  canvas.height = OUTPUT_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas non supportato')
  // sfondo bianco: l'output è JPEG, eventuali zone trasparenti diventerebbero nere
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE)
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob fallito'))), 'image/jpeg', 0.92)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    // necessario per non "sporcare" il canvas quando l'immagine arriva da Supabase Storage
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('caricamento immagine fallito'))
    img.src = src
  })
}
