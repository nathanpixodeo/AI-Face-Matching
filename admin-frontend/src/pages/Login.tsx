import { useState, type FormEvent } from 'react'
import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../auth/AuthContext'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { useI18n } from '../i18n'

export function Login() {
  const { isAuthenticated, login } = useAdminAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) return <Navigate to="/" replace />

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      navigate((location.state as { from?: string } | null)?.from ?? '/', { replace: true })
    } catch (caught) {
      setError(caught instanceof Error && caught.message === 'ADMIN_ACCESS_REQUIRED' ? t('invalidAdmin') : caught instanceof Error ? caught.message : t('invalidAdmin'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-panel">
        <div className="login-brand">
          <div className="brand-mark"><ShieldCheck size={24} /></div>
          <div><strong>FaceMatch</strong><span>{t('platform')}</span></div>
        </div>
        <h1>{t('signIn')}</h1>
        <p>{t('secureAccess')}</p>
        <form onSubmit={submit}>
          <label>{t('email')}<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
          <label>{t('password')}<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? '…' : <><span>{t('signInButton')}</span><ArrowRight size={17} /></>}
          </button>
        </form>
        <div className="login-security"><LockKeyhole size={15} /> API authorization is verified on every request.</div>
      </div>
      <div className="login-aside">
        <LanguageSwitcher />
        <div className="login-orbit orbit-one" /><div className="login-orbit orbit-two" />
        <div className="aside-copy"><span>FACE MATCH / PLATFORM</span><h2>One boundary.<br />Full oversight.</h2><p>Separate application, separate session, server-enforced access.</p></div>
      </div>
    </main>
  )
}
