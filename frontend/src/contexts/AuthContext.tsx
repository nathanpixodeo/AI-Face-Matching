import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { api } from '../lib/api'
import type { User } from '../types'

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
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        if (payload.exp * 1000 < Date.now()) {
          logout()
          return
        }
        setUser({ _id: payload.user_id || payload.sub, email: payload.email, first_name: payload.first_name || '', last_name: payload.last_name || '', role: payload.role || 'member' })
      } catch { logout() }
    }
    setLoading(false)
  }, [token])

  function logout() {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
  }

  async function login(email: string, password: string) {
    const res = await api.auth.login({ email, password })
    localStorage.setItem('token', res.token)
    setToken(res.token)
    setUser(res.user)
  }

  async function register(data: { first_name: string; last_name: string; email: string; password: string; team_name: string }) {
    const res = await api.auth.register(data)
    localStorage.setItem('token', res.token)
    setToken(res.token)
    setUser(res.user)
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
