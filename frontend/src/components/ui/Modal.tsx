import { useEffect, useRef, type ReactNode } from 'react'
import { clsx } from 'clsx'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const overlay = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div ref={overlay} className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === overlay.current) onClose() }}>
      <div className="fixed inset-0 bg-[#1d1e24]/45 backdrop-blur-sm" />
      <div className={clsx(
        'relative w-full overflow-hidden rounded-xl bg-white shadow-[0_28px_70px_rgba(42,49,60,.22)]',
        { 'max-w-sm': size === 'sm', 'max-w-lg': size === 'md', 'max-w-2xl': size === 'lg' }
      )}>
        {title && (
          <div className="flex items-center justify-between border-b border-[#edf2f7] px-6 py-5">
            <h2 className="font-bankco-display text-lg font-semibold tracking-[-.03em] text-[#1a202c]">{title}</h2>
            <button onClick={onClose} className="bankco-icon-button h-8 w-8">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
