import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useI18n } from '../i18n/locale'

export default function Login() {
  const { login } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('Login failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="mb-8 text-center">
        <p className="mb-3 text-xs font-bold uppercase tracking-[.13em] text-primary-600">{t('Welcome back')}</p>
        <h1 className="font-bankco-display text-3xl font-semibold tracking-[-.045em] text-[#1a202c]">{t('Sign in to FaceMatch.')}</h1>
        <p className="mt-2 text-base font-medium text-[#718096]">{t('Continue to your identity workspace')}</p>
      </div>

      {error && <div className="rounded-lg border border-[#fcDEDE] bg-[#fff7f7] px-4 py-3 text-sm font-medium text-[#dd3333]">{error}</div>}

      <Input
        label={t('Email')}
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        icon={<Mail className="w-4 h-4" />}
        required
      />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-[#4a5568]">{t('Password')}</label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#a0aec0]">
            <Lock className="w-4 h-4" />
          </div>
          <input
            type={showPw ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="block min-h-14 w-full rounded-lg border border-[#e2e8f0] bg-white py-3.5 pl-11 pr-11 text-base text-[#2d3748] placeholder:text-[#a0aec0] focus:border-primary-500 focus:outline-none"
            required
          />
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#a0aec0] hover:text-[#4a5568]">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex justify-between -mt-1">
        <span className="text-xs font-medium text-[#718096]">{t('Secure workspace access')}</span>
        <Link to="/forgot-password" className="text-xs font-bold text-primary-600 hover:text-primary-700">{t('Forgot password?')}</Link>
      </div>

      <Button type="submit" className="w-full" loading={loading}>{t('Sign in')}</Button>

      <p className="pt-1 text-center text-sm text-[#718096]">
        {t("Don't have an account?")}{' '}
        <Link to="/register" className="font-bold text-primary-600 hover:text-primary-700">{t('Create one')}</Link>
      </p>
    </form>
  )
}
