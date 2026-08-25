import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { adminApi, adminTokenKey } from '../lib/api'
import type { AuthUser } from '../types'

interface AdminAuthValue {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null)

function storedUser(): AuthUser | null {
  try {
    const raw = window.localStorage.getItem('facematch.admin.user')
    const user = raw ? (JSON.parse(raw) as AuthUser) : null
    return user?.isSuperadmin ? user : null
  } catch {
    return null
  }
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(storedUser)

  const logout = useCallback(() => {
    window.localStorage.removeItem(adminTokenKey)
    window.localStorage.removeItem('facematch.admin.user')
    setUser(null)
  }, [])

  useEffect(() => {
    window.addEventListener('facematch:admin-unauthorized', logout)
    return () => window.removeEventListener('facematch:admin-unauthorized', logout)
  }, [logout])

  const login = useCallback(async (email: string, password: string) => {
    const result = await adminApi.login(email, password)
    if (!result.user.isSuperadmin) {
      logout()
      throw new Error('ADMIN_ACCESS_REQUIRED')
    }
    window.localStorage.setItem(adminTokenKey, result.token)
    window.localStorage.setItem('facematch.admin.user', JSON.stringify(result.user))
    setUser(result.user)
  }, [logout])

  const value = useMemo(() => ({ user, isAuthenticated: Boolean(user), login, logout }), [user, login, logout])
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) throw new Error('useAdminAuth must be used inside AdminAuthProvider')
  return context
}
