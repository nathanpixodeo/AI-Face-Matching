import { clsx } from 'clsx'

export function Avatar({ src, name, size = 'md' }: { src?: string; name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div className={clsx(
      'flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#1a202c] font-bold text-white',
      { 'w-8 h-8 text-xs': size === 'sm' },
      { 'w-10 h-10 text-sm': size === 'md' },
      { 'w-16 h-16 text-lg': size === 'lg' },
    )}>
      {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : initials}
    </div>
  )
}
