import { clsx } from 'clsx'

export function Badge({ variant = 'gray', children }: { variant?: 'green' | 'yellow' | 'red' | 'blue' | 'orange' | 'gray'; children: React.ReactNode }) {
  return (
    <span className={clsx(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      { 'bg-success-50 text-success-600': variant === 'green' },
      { 'bg-yellow-50 text-yellow-700': variant === 'yellow' },
      { 'bg-red-50 text-red-600': variant === 'red' },
      { 'bg-blue-50 text-primary-700': variant === 'blue' },
      { 'bg-orange-50 text-orange-600': variant === 'orange' },
      { 'bg-gray-100 text-gray-600': variant === 'gray' },
    )}>
      {children}
    </span>
  )
}
