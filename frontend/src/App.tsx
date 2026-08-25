import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { LocaleProvider } from './i18n/locale'
import { AppLayout } from './components/layout/AppLayout'
import { AuthLayout } from './components/layout/AuthLayout'
import type { ReactNode } from 'react'

const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Identities = lazy(() => import('./pages/Identities'))
const IdentityDetail = lazy(() => import('./pages/IdentityDetail'))
const UploadPage = lazy(() => import('./pages/Upload'))
const UploadReview = lazy(() => import('./pages/UploadReview'))
const FaceMatch = lazy(() => import('./pages/FaceMatch'))
const Images = lazy(() => import('./pages/Images'))
const ImageDetail = lazy(() => import('./pages/ImageDetail'))
const Workspaces = lazy(() => import('./pages/Workspaces'))
const Settings = lazy(() => import('./pages/Settings'))
const Superadmin = lazy(() => import('./pages/Superadmin'))

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

function SuperadminRoute({ children }: { children: ReactNode }) {
  const { token, user, loading } = useAuth()
  if (loading) return null
  if (!token) return <Navigate to="/login" replace />
  if (!user?.isSuperadmin) return <Navigate to="/" replace />
  return <>{children}</>
}

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>}>{children}</Suspense>
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <LocaleProvider>
        <BrowserRouter>
          <AuthProvider>
            <ToastProvider>
            <Routes>
              <Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
                <Route path="/login" element={<Lazy><Login /></Lazy>} />
                <Route path="/register" element={<Lazy><Register /></Lazy>} />
                <Route path="/forgot-password" element={<Lazy><ForgotPassword /></Lazy>} />
                <Route path="/reset-password/:token" element={<Lazy><ResetPassword /></Lazy>} />
              </Route>

              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/" element={<Lazy><Dashboard /></Lazy>} />
                <Route path="/identities" element={<Lazy><Identities /></Lazy>} />
                <Route path="/identities/:id" element={<Lazy><IdentityDetail /></Lazy>} />
                <Route path="/upload" element={<Lazy><UploadPage /></Lazy>} />
                <Route path="/upload/:batchId/review" element={<Lazy><UploadReview /></Lazy>} />
                <Route path="/match" element={<Lazy><FaceMatch /></Lazy>} />
                <Route path="/images" element={<Lazy><Images /></Lazy>} />
                <Route path="/images/:id" element={<Lazy><ImageDetail /></Lazy>} />
                <Route path="/workspaces" element={<Lazy><Workspaces /></Lazy>} />
                <Route path="/settings" element={<Lazy><Settings /></Lazy>} />
                <Route path="/superadmin" element={<SuperadminRoute><Lazy><Superadmin /></Lazy></SuperadminRoute>} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </LocaleProvider>
    </QueryClientProvider>
  )
}
