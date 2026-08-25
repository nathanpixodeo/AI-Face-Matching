import { clsx } from 'clsx'

export function ProgressBar({ value, max = 100, variant = 'primary', showLabel = false, size = 'md' }: { value: number; max?: number; variant?: 'primary' | 'green' | 'yellow' | 'red'; showLabel?: boolean; size?: 'sm' | 'md' }) {
  const pct = Math.min(Math.round((value / max) * 100), 100)
  return (
    <div className="space-y-1">
      {showLabel && <div className="flex justify-between text-xs text-gray-500"><span>{value}/{max}</span><span>{pct}%</span></div>}
      <div className={clsx('w-full overflow-hidden rounded-full bg-[#edf2f7]', { 'h-1.5': size === 'sm', 'h-2': size === 'md' })}>
        <div
          className={clsx('h-full rounded-full transition-all duration-500', {
            'bg-primary-500': variant === 'primary',
            'bg-success-500': variant === 'green',
            'bg-yellow-500': variant === 'yellow',
            'bg-danger-500': variant === 'red',
          })}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
