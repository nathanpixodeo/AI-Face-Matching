import { clsx } from 'clsx'

export function Badge({ variant = 'gray', children }: { variant?: 'green' | 'yellow' | 'red' | 'blue' | 'orange' | 'gray'; children: React.ReactNode }) {
  return (
    <span className={clsx(
      'inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.07em]',
      { 'bg-[#d9fbe6] text-[#15803d]': variant === 'green' },
      { 'bg-[#fffbea] text-[#a16207]': variant === 'yellow' },
      { 'bg-[#fcDEDE] text-[#dd3333]': variant === 'red' },
      { 'bg-[#f2f6ff] text-[#475569]': variant === 'blue' },
      { 'bg-[#fff0eb] text-[#c2410c]': variant === 'orange' },
      { 'bg-[#edf2f7] text-[#718096]': variant === 'gray' },
    )}>
      {children}
    </span>
  )
}
