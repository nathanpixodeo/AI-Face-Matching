import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Users, Upload, Search, Image, Layers, Settings, ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { clsx } from 'clsx'
import { TopBar } from './TopBar'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/identities', icon: Users, label: 'Identities' },
  { to: '/upload', icon: Upload, label: 'Upload' },
  { to: '/match', icon: Search, label: 'Face Match' },
  { to: '/images', icon: Image, label: 'Images' },
  { to: '/workspaces', icon: Layers, label: 'Workspaces' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <aside className={clsx(
        'fixed top-0 left-0 z-50 h-full bg-white border-r border-gray-200 transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-64',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className={clsx('flex items-center h-16 px-4 border-b border-gray-100 shrink-0', collapsed && 'justify-center')}>
          {!collapsed && <span className="text-xl font-bold text-primary-600">FaceMatch</span>}
          {collapsed && <span className="text-xl font-bold text-primary-600">FM</span>}
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                collapsed && 'justify-center px-2'
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center h-12 border-t border-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
        >
          <ChevronLeft className={clsx('w-5 h-5 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </aside>

      <div className={clsx('transition-all duration-300', collapsed ? 'lg:ml-16' : 'lg:ml-64')}>
        <TopBar onMenuClick={() => setMobileOpen(true)} />

        <main className="p-4 lg:p-6 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
