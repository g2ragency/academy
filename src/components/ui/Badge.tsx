import { cn } from '@/lib/utils'
import { type CourseType, COURSE_TYPE_LABELS, COURSE_TYPE_COLORS } from '@/types'

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

export function CourseTypeBadge({ type }: { type: CourseType }) {
  return (
    <span className={cn('badge', COURSE_TYPE_COLORS[type])}>
      {COURSE_TYPE_LABELS[type]}
    </span>
  )
}
