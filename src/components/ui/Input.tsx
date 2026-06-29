import { cn } from '@/lib/utils'
import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  /** override stile label (es. checkout: 22px bianca) */
  labelClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, labelClassName, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className={cn('label', labelClassName)}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn('input', error && 'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/30', className)}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
