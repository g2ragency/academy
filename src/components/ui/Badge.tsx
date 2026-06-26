'use client'

import { cn } from '@/lib/utils'
import { useFormat } from '@/context/FormatsContext'
import { DEFAULT_FORMAT_LABELS } from '@/types'

interface BadgeProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'brand'
}

export function Badge({ children, className, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={cn(
        'badge',
        variant === 'brand' && 'bg-brand/20 text-brand border-brand/30',
        variant === 'default' && 'bg-surface-elevated text-white/70 border-surface-border',
        className
      )}
    >
      {children}
    </span>
  )
}

export function CourseTypeBadge({ type, className }: { type: string; className?: string }) {
  // Targhetta tipo corso (Figma): radius 10, #1B1B1B + blur 15, testo #989898.
  // La label arriva dal formato (course_formats via context); fallback agli
  // slug di default e infine allo slug grezzo.
  const format = useFormat(type)
  const label = format?.name ?? DEFAULT_FORMAT_LABELS[type] ?? type
  return (
    <span
      className={cn(
        'inline-flex items-center text-xs px-[18px] py-2 rounded-[10px] bg-card backdrop-blur-[15px] text-[#989898]',
        className
      )}
    >
      {label}
    </span>
  )
}
