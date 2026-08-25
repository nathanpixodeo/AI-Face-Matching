import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { api } from '../lib/api'
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { useI18n } from '../i18n/locale'

export default function ResetPassword() {
  const { t } = useI18n()
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setError('')
    setLoading(true)
    try {
      await api.auth.resetPassword(token, password)
      setDone(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('Reset failed'))
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#d9fbe6] text-primary-600">
          <CheckCircle className="w-6 h-6" />
        </div>
        <h1 className="font-bankco-display text-3xl font-semibold tracking-[-.045em] text-[#1a202c]">{t('Password reset.')}</h1>
        <p className="text-base leading-7 text-[#718096]">{t('Your password has been updated. Redirecting to login...')}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="mb-8 text-center">
        <p className="mb-3 text-xs font-bold uppercase tracking-[.13em] text-primary-600">{t('Account recovery')}</p>
        <h1 className="font-bankco-display text-3xl font-semibold tracking-[-.045em] text-[#1a202c]">{t('Set new password.')}</h1>
        <p className="mt-2 text-base font-medium text-[#718096]">{t('Choose a new password for your workspace')}</p>
      </div>

      {error && <div className="rounded-lg border border-[#fcDEDE] bg-[#fff7f7] px-4 py-3 text-sm font-medium text-[#dd3333]">{error}</div>}

      <div className="space-y-1">
        <label className="block text-sm font-medium text-[#4a5568]">{t('New password')}</label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#a0aec0]">
            <Lock className="w-4 h-4" />
          </div>
          <input
            type={showPw ? 'text' : 'password'}
            placeholder={t('Min 8 characters')}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="block min-h-14 w-full rounded-lg border border-[#e2e8f0] bg-white py-3.5 pl-11 pr-11 text-base text-[#2d3748] placeholder:text-[#a0aec0] focus:border-primary-500 focus:outline-none"
            required
            minLength={8}
          />
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#a0aec0] hover:text-[#4a5568]">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <Button type="submit" className="w-full" loading={loading}>{t('Reset password')}</Button>

      <p className="text-center text-sm text-[#718096]">
        <Link to="/login" className="font-bold text-primary-600 hover:text-primary-700">{t('Back to login')}</Link>
      </p>
    </form>
  )
}
