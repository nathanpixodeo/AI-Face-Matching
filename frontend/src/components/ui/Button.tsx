import type { ButtonHTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-bold tracking-normal transition-[background-color,border-color,color,box-shadow] duration-200 focus:outline-none focus:ring-4 focus:ring-primary-100 disabled:pointer-events-none disabled:opacity-50',
        {
          'bg-primary-500 text-white shadow-[0_8px_16px_rgba(34,197,94,.18)] hover:bg-primary-600': variant === 'primary',
          'border border-[#e2e8f0] bg-white text-[#4a5568] hover:border-[#b7ffd1] hover:bg-[#f7fff9] hover:text-[#1a202c]': variant === 'secondary',
          'bg-danger-500 text-white shadow-[0_8px_16px_rgba(255,71,71,.14)] hover:bg-danger-600': variant === 'danger',
          'text-[#718096] hover:bg-[#f7fafc] hover:text-[#1a202c]': variant === 'ghost',
        },
        {
          'min-h-8 px-3 py-1 text-xs': size === 'sm',
          'min-h-11 px-4 py-2.5 text-sm': size === 'md',
          'min-h-14 px-6 py-3.5 text-base': size === 'lg',
        },
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
