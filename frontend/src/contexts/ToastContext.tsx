import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { clsx } from 'clsx'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

interface Toast {
  id: number
  type: 'success' | 'error' | 'info'
  message: string
}

interface ToastCtx {
  toast: (type: Toast['type'], message: string) => void
}

const ToastContext = createContext<ToastCtx | null>(null)

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((type: Toast['type'], message: string) => {
    const id = nextId++
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const remove = (id: number) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map(t => (
          <div key={t.id} className={clsx(
            'flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-sm animate-in slide-in-from-right-2 fade-in',
            t.type === 'success' && 'bg-white border-success-200 text-success-700',
            t.type === 'error' && 'bg-white border-danger-200 text-danger-700',
            t.type === 'info' && 'bg-white border-primary-200 text-primary-700',
          )}>
            {t.type === 'success' && <CheckCircle className="w-5 h-5 shrink-0 text-success-500" />}
            {t.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0 text-danger-500" />}
            {t.type === 'info' && <Info className="w-5 h-5 shrink-0 text-primary-500" />}
            <p className="text-sm font-medium flex-1">{t.message}</p>
            <button onClick={() => remove(t.id)} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
