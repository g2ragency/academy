import { cn } from '@/lib/utils'
import { type CourseType, COURSE_TYPE_LABELS } from '@/types'

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

export function CourseTypeBadge({ type, className }: { type: CourseType; className?: string }) {
  // Targhetta tipo corso (Figma): radius 10, #1B1B1B + blur 15, testo #989898.
  // className opzionale per varianti (es. sfondo chiaro nelle row card).
  return (
    <span
      className={cn(
        'inline-flex items-center text-xs px-[18px] py-2 rounded-[10px] bg-[#1B1B1B] backdrop-blur-[15px] text-[#989898]',
        className
      )}
    >
      {COURSE_TYPE_LABELS[type]}
    </span>
  )
}
