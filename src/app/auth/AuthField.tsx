'use client'

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  icon: ReactNode
  /** Elemento a destra dentro il campo (es. toggle visibilità password) */
  rightSlot?: ReactNode
  error?: string
}

/** Campo input delle pagine auth (design Figma): pillola con icona a sinistra, niente label */
const AuthField = forwardRef<HTMLInputElement, Props>(({ icon, rightSlot, error, ...props }, ref) => (
  <div>
    <div
      className={`flex items-center gap-3 bg-surface backdrop-blur-[20px] border-[0.5px] h-[50px] sm:h-[65px] rounded-[15px] sm:rounded-[20px] px-4 sm:px-5 transition-colors ${
        error ? 'border-red-500' : 'border-white'
      }`}
    >
      <span className="text-muted shrink-0 [&>svg]:w-[18px] [&>svg]:h-[18px] sm:[&>svg]:w-[22px] sm:[&>svg]:h-[22px]">{icon}</span>
      <input
        ref={ref}
        className="flex-1 min-w-0 bg-transparent text-[16px] sm:text-[18px] leading-none text-white placeholder:text-muted focus:outline-none"
        {...props}
      />
      {rightSlot}
    </div>
    {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
  </div>
))

AuthField.displayName = 'AuthField'
export default AuthField
