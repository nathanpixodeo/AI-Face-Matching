import { Upload } from 'lucide-react'

export function EmptyState({ icon, title, description, action }: { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="bankco-panel flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-[#f7fafc] text-primary-500 ring-8 ring-[#f7fafc]">
        {icon || <Upload className="w-8 h-8" />}
      </div>
      <h3 className="mb-1 font-bankco-display text-lg font-semibold tracking-[-.03em] text-[#1a202c]">{title}</h3>
      {description && <p className="mb-6 max-w-sm text-sm leading-6 text-[#718096]">{description}</p>}
      {action}
    </div>
  )
}
