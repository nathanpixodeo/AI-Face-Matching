import { clsx } from 'clsx'

export function Avatar({ src, name, size = 'md' }: { src?: string; name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div className={clsx(
      'rounded-full flex items-center justify-center font-medium text-white bg-primary-600 shrink-0 overflow-hidden',
      { 'w-8 h-8 text-xs': size === 'sm' },
      { 'w-10 h-10 text-sm': size === 'md' },
      { 'w-16 h-16 text-lg': size === 'lg' },
    )}>
      {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : initials}
    </div>
  )
}
