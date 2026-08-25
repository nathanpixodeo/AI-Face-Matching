import { NavLink, Outlet } from 'react-router-dom'
import {
  Building2,
  FileImage,
  LayoutDashboard,
  Layers3,
  PanelLeftClose,
  ScanSearch,
  Settings,
  ShieldCheck,
  UploadCloud,
  UsersRound,
} from 'lucide-react'
import { useState } from 'react'
import { clsx } from 'clsx'
import { TopBar } from './TopBar'
import { useAuth } from '../../contexts/AuthContext'
import { useI18n } from '../../i18n/locale'

const workspaceItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/identities', icon: UsersRound, label: 'Identities' },
  { to: '/upload', icon: UploadCloud, label: 'Upload images' },
  { to: '/match', icon: ScanSearch, label: 'Face match' },
  { to: '/images', icon: FileImage, label: 'Image library' },
  { to: '/workspaces', icon: Layers3, label: 'Workspaces' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

function Wordmark({ compact, t }: { compact: boolean; t: (key: string) => string }) {
  return (
    <div className="flex items-center gap-3 overflow-hidden">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#1a202c] text-sm font-bold text-white shadow-[0_8px_20px_rgba(26,32,44,.16)]">
        <span className="relative">FM<span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[#22c55e]" /></span>
      </div>
      {!compact && <div className="min-w-0"><p className="font-bankco-display text-lg font-semibold tracking-[-.04em] text-[#1a202c]">FaceMatch</p><p className="mt-0.5 text-[10px] font-bold uppercase tracking-[.14em] text-[#718096]">{t('Identity operations')}</p></div>}
    </div>
  )
}

export function AppLayout() {
  const { user } = useAuth()
  const { t } = useI18n()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const sidebarWidth = collapsed ? 'xl:w-[92px]' : 'xl:w-[308px]'
  const contentOffset = collapsed ? 'xl:ml-[92px]' : 'xl:ml-[308px]'

  return (
    <div className="min-h-screen bg-[#f7fafc]">
      {mobileOpen && <button aria-label={t('Close navigation')} className="fixed inset-0 z-40 bg-[#1d1e24]/40 backdrop-blur-[1px] xl:hidden" onClick={() => setMobileOpen(false)} />}

      <aside
        className={clsx(
          'app-sidebar fixed left-0 top-0 z-50 flex h-full w-[308px] flex-col border-r border-[#f0f1f2] bg-white text-[#1a202c] shadow-[8px_0_32px_rgba(42,49,60,.025)] transition-[width,transform] duration-300',
          sidebarWidth,
        )}
        data-mobile-open={mobileOpen}
      >
        <div className={clsx('relative flex h-[108px] shrink-0 items-center border-b border-[#f0f1f2] px-8', collapsed && 'xl:justify-center xl:px-4')}>
          <Wordmark compact={collapsed} t={t} />
          <button
            onClick={() => setCollapsed((value) => !value)}
            aria-label={t(collapsed ? 'Expand navigation' : 'Collapse navigation')}
            title={t(collapsed ? 'Expand navigation' : 'Collapse navigation')}
            className="absolute -right-3 hidden h-10 w-6 place-items-center rounded-r-full bg-primary-500 text-white shadow-[4px_3px_10px_rgba(34,197,94,.22)] transition-colors hover:bg-primary-600 xl:grid"
          >
            <PanelLeftClose className={clsx('h-4 w-4 transition-transform duration-300', collapsed && 'rotate-180')} />
          </button>
        </div>

        <nav className={clsx('flex-1 overflow-y-auto px-8 py-7', collapsed && 'xl:px-4')}>
          {!collapsed && <p className="border-b border-[#edf2f7] pb-2 text-sm font-medium text-[#4a5568]">{t('Menu')}</p>}
          {collapsed && <div className="mx-auto mb-3 h-px w-8 bg-[#edf2f7]" />}
          <ul className="space-y-1.5 pt-3">
            {workspaceItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? t(item.label) : undefined}
                  className={({ isActive }) => clsx(
                    'group relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-[15px] font-medium transition-all duration-200',
                    isActive ? 'bg-[#f1fff5] text-[#1a202c]' : 'text-[#718096] hover:bg-[#f7fafc] hover:text-[#1a202c]',
                    collapsed && 'justify-center px-0',
                  )}
                >
                  {({ isActive }) => <>
                    <item.icon className={clsx('h-[19px] w-[19px] shrink-0 transition-colors', isActive ? 'text-primary-500' : 'text-[#718096] group-hover:text-[#1a202c]')} />
                    {!collapsed && <span>{t(item.label)}</span>}
                    {isActive && !collapsed && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-500" />}
                  </>}
                </NavLink>
              </li>
            ))}
          </ul>

          {user?.isSuperadmin && <>
            {!collapsed && <p className="mt-9 border-b border-[#edf2f7] pb-2 text-sm font-medium text-[#4a5568]">{t('Platform')}</p>}
            <ul className="pt-3">
              <li>
                <NavLink
                  to="/superadmin"
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? t('Platform') : undefined}
                  className={({ isActive }) => clsx(
                    'group relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-[15px] font-medium transition-all duration-200',
                    isActive ? 'bg-[#f1fff5] text-[#1a202c]' : 'text-[#718096] hover:bg-[#f7fafc] hover:text-[#1a202c]',
                    collapsed && 'justify-center px-0',
                  )}
                >
                  {({ isActive }) => <><ShieldCheck className={clsx('h-[19px] w-[19px] shrink-0', isActive ? 'text-primary-500' : 'text-[#718096]')} />{!collapsed && <span>{t('Platform control')}</span>}{isActive && !collapsed && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-500" />}</>}
                </NavLink>
              </li>
            </ul>
          </>}
        </nav>

        {!collapsed && <div className="m-6 mt-0 rounded-xl bg-[#f7fafc] p-4 transition-opacity xl:opacity-100">
          <div className="flex items-center gap-3"><div className="grid h-8 w-8 place-items-center rounded-lg bg-white text-primary-500 shadow-sm"><Building2 className="h-4 w-4" /></div><div><p className="text-xs font-bold text-[#2d3748]">{t('Workspace ready')}</p><p className="mt-0.5 text-[11px] text-[#718096]">{t('Secure image processing')}</p></div></div>
        </div>}
      </aside>

      <div className={clsx('min-w-0 transition-[margin] duration-300', contentOffset)}>
        <TopBar onMenuClick={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-[1680px] px-4 py-7 sm:px-7 xl:px-12 xl:py-10"><Outlet /></main>
      </div>
    </div>
  )
}
