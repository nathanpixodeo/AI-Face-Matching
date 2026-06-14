import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { AppLayout } from './components/layout/AppLayout'
import { AuthLayout } from './components/layout/AuthLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Identities from './pages/Identities'
import IdentityDetail from './pages/IdentityDetail'
import UploadPage from './pages/Upload'
import UploadReview from './pages/UploadReview'
import FaceMatch from './pages/FaceMatch'
import Images from './pages/Images'
import ImageDetail from './pages/ImageDetail'
import Workspaces from './pages/Workspaces'
import Settings from './pages/Settings'
import type { ReactNode } from 'react'

const qc = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000, refetchOnWindowFocus: false },
  },
})

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth()
  if (loading) return null
  if (token) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>

              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/identities" element={<Identities />} />
                <Route path="/identities/:id" element={<IdentityDetail />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/upload/:batchId/review" element={<UploadReview />} />
                <Route path="/match" element={<FaceMatch />} />
                <Route path="/images" element={<Images />} />
                <Route path="/images/:id" element={<ImageDetail />} />
                <Route path="/workspaces" element={<Workspaces />} />
                <Route path="/settings" element={<Settings />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
