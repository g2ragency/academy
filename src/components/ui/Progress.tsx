import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number
  className?: string
  showLabel?: boolean
}

export function Progress({ value, className, showLabel }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex-1 bg-surface-border rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full bg-brand rounded-full transition-all duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-white/50 tabular-nums w-8 text-right">{clamped}%</span>
      )}
    </div>
  )
}
