import { Navigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../auth/AuthContext'
import type { ReactNode } from 'react'

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAdminAuth()
  const location = useLocation()
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <>{children}</>
}
