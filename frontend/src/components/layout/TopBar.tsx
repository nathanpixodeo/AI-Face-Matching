import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, Menu, Plus, Search, Settings, UserRound } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { LanguageSwitcher } from '../ui/LanguageSwitcher'
import { useI18n } from '../../i18n/locale'

const pageLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/identities': 'Identities',
  '/upload': 'Upload images',
  '/match': 'Face match',
  '/images': 'Image library',
  '/workspaces': 'Workspaces',
  '/settings': 'Settings',
  '/superadmin': 'Platform control',
}

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const { t } = useI18n()
  const ref = useRef<HTMLDivElement>(null)
  const label = pageLabels[location.pathname] ?? 'FaceMatch'

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center gap-3 border-b border-[#edf2f7] bg-white px-4 sm:px-7 xl:h-[108px] xl:px-12">
      <button aria-label={t('Open navigation')} title={t('Open navigation')} className="bankco-icon-button xl:hidden" onClick={onMenuClick}><Menu className="h-5 w-5" /></button>

      <div className="min-w-0 shrink-0">
        <p className="text-[11px] font-bold uppercase tracking-[.13em] text-[#a0aec0]">{t('FaceMatch workspace')}</p>
        <p className="mt-1 truncate font-bankco-display text-base font-semibold tracking-[-.025em] text-[#1a202c] sm:text-lg">{t(label)}</p>
      </div>

      <label className="relative ml-auto hidden min-w-0 max-w-[340px] flex-1 lg:block">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a0aec0]" />
        <input aria-label={t('Search workspace')} placeholder={t('Search workspace')} className="h-12 w-full rounded-lg border border-[#edf2f7] bg-[#f7fafc] py-3 pl-11 pr-4 text-sm text-[#2d3748] outline-none transition-colors placeholder:text-[#a0aec0] focus:border-[#b7ffd1] focus:bg-white focus:ring-4 focus:ring-[#d9fbe6]/70" />
      </label>

      <button onClick={() => navigate('/upload')} className="hidden h-11 items-center gap-2 rounded-lg bg-primary-500 px-4 text-sm font-bold text-white shadow-[0_8px_16px_rgba(34,197,94,.18)] transition-colors hover:bg-primary-600 sm:inline-flex"><Plus className="h-4 w-4" />{t('New upload')}</button>
      <div className="hidden lg:block"><LanguageSwitcher compact /></div>
      <span className="relative hidden h-11 w-11 place-items-center rounded-lg border border-[#edf2f7] text-[#718096] lg:grid"><Bell className="h-5 w-5" /><span className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-primary-500" /></span>

      <div ref={ref} className="relative shrink-0">
        <button data-testid="user-menu" onClick={() => setOpen((value) => !value)} className="flex items-center gap-2.5 rounded-lg border border-transparent p-1.5 transition-colors hover:border-[#edf2f7] hover:bg-[#f7fafc]">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#1a202c] text-sm font-bold text-white">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div className="hidden max-w-44 text-left md:block"><p className="truncate text-sm font-bold text-[#2d3748]">{user?.first_name} {user?.last_name}</p><p className="mt-0.5 truncate text-xs text-[#718096]">{user?.email}</p></div>
          <ChevronDown className="hidden h-4 w-4 text-[#a0aec0] sm:block" />
        </button>

        {open && <div className="absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-xl border border-[#edf2f7] bg-white py-2 shadow-[0_18px_40px_rgba(42,49,60,.14)]">
          <div className="border-b border-[#edf2f7] px-4 py-3 md:hidden"><p className="text-sm font-bold text-[#2d3748]">{user?.first_name} {user?.last_name}</p><p className="mt-0.5 text-xs text-[#718096]">{user?.email}</p></div>
          <button onClick={() => { navigate('/settings'); setOpen(false) }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-[#4a5568] transition-colors hover:bg-[#f7fafc] hover:text-[#1a202c]"><UserRound className="h-4 w-4 text-[#718096]" />{t('Profile & settings')}</button>
          <button onClick={() => { logout(); navigate('/login'); setOpen(false) }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-[#dd3333] transition-colors hover:bg-[#fff5f5]"><Settings className="h-4 w-4" />{t('Sign out')}</button>
        </div>}
      </div>
    </header>
  )
}
