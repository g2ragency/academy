import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
          variant === 'primary' && 'bg-brand text-black hover:bg-brand-light',
          variant === 'secondary' && 'bg-surface-elevated text-white border border-surface-border hover:bg-surface-card',
          variant === 'ghost' && 'text-white/70 hover:text-white hover:bg-surface-elevated',
          variant === 'danger' && 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30',
          size === 'sm' && 'text-sm px-3 py-1.5 gap-1.5',
          size === 'md' && 'text-sm px-5 py-2.5 gap-2',
          size === 'lg' && 'text-base px-7 py-3.5 gap-2',
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {children}
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
