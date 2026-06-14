import { clsx } from 'clsx'
import type { ReactNode } from 'react'

export function Card({ className, children, ...props }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('bg-white rounded-xl border border-gray-200', className)} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx('px-6 py-4 border-b border-gray-100', className)}>{children}</div>
}

export function CardContent({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx('px-6 py-4', className)}>{children}</div>
}
