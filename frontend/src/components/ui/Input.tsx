import type { InputHTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export function Input({ label, error, icon, className, ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-[#4a5568]">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">{icon}</div>}
        <input
          className={clsx(
            'block min-h-14 w-full rounded-lg border bg-white px-4 py-3.5 text-base text-[#2d3748] placeholder:text-[#a0aec0] transition-colors focus:outline-none focus:ring-0',
            icon && 'pl-10',
            error ? 'border-danger-500' : 'border-[#e2e8f0] focus:border-primary-500',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-danger-500">{error}</p>}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}

export function Select({ label, options, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-[#4a5568]">{label}</label>}
      <select
        className={clsx('block min-h-14 w-full rounded-lg border border-[#e2e8f0] bg-white px-4 py-3 text-base text-[#2d3748] focus:border-primary-500 focus:outline-none', className)}
        {...props}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}
