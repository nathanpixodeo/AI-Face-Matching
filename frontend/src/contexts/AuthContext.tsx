import { createContext, useContext, useState, useMemo, useEffect, type ReactNode } from 'react'
import { api } from '../lib/api'
import type { User } from '../types'

function parseToken(token: string): User | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as {
      exp: number
      userId?: string
      user_id?: string
      sub?: string
      email: string
      firstName?: string
      first_name?: string
      lastName?: string
      last_name?: string
      role?: string
      isSuperadmin?: boolean
    }
    if (payload.exp * 1000 < Date.now()) return null
    const userId = payload.userId || payload.user_id || payload.sub
    if (!userId) return null
    return {
      _id: userId,
      email: payload.email,
      first_name: payload.firstName || payload.first_name || '',
      last_name: payload.lastName || payload.last_name || '',
      role: payload.role || 'member',
      isSuperadmin: payload.isSuperadmin === true,
    }
  } catch {
    return null
  }
}

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: { first_name: string; last_name: string; email: string; password: string; team_name: string }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    const t = localStorage.getItem('token')
    return t && parseToken(t) ? t : null
  })
  const [loading, setLoading] = useState(true)

  const user = useMemo(() => (token ? parseToken(token) : null), [token])

  useEffect(() => {
    if (token !== null) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  }, [token])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setLoading(false) }, [])

  function logout() {
    setToken(null)
  }

  async function login(email: string, password: string) {
    const res = await api.auth.login({ email, password })
    setToken(res.token)
  }

  async function register(data: { first_name: string; last_name: string; email: string; password: string; team_name: string }) {
    const res = await api.auth.register(data)
    setToken(res.token)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
