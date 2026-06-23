'use client'

import { forwardRef, type InputHTMLAttributes } from 'react'

/** Checkbox stilizzata come le input auth: bordo 0.5px #F4F3F3, sfondo nero, radius 7px */
const AuthCheckbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <div className={`relative shrink-0 w-5 h-5 ${className ?? ''}`}>
      {/* Input reale invisibile ma cliccabile */}
      <input
        ref={ref}
        type="checkbox"
        className="peer absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        {...props}
      />
      {/* Box visivo */}
      <div className="w-5 h-5 rounded-[7px] border-[0.5px] border-white bg-surface peer-checked:bg-white transition-colors" />
      {/* Checkmark — visibile solo quando checked */}
      <svg
        className="absolute inset-0 w-5 h-5 p-1 text-black pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"
        viewBox="0 0 10 8"
        fill="none"
      >
        <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
)

AuthCheckbox.displayName = 'AuthCheckbox'
export default AuthCheckbox
