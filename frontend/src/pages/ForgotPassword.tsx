import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { api } from '../lib/api'
import { Mail, ArrowLeft } from 'lucide-react'
import { useI18n } from '../i18n/locale'

export default function ForgotPassword() {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.auth.forgotPassword(email)
      setSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('Request failed'))
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#d9fbe6] text-primary-600">
          <Mail className="w-6 h-6" />
        </div>
        <h1 className="font-bankco-display text-3xl font-semibold tracking-[-.045em] text-[#1a202c]">{t('Check your email.')}</h1>
        <p className="text-base leading-7 text-[#718096]">{t("If an account with that email exists, we've sent a reset link.")}</p>
        <Link to="/login" className="inline-flex items-center gap-1 text-sm font-bold text-primary-600 hover:text-primary-700">
          <ArrowLeft className="w-4 h-4" /> {t('Back to login')}
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="mb-8 text-center">
        <p className="mb-3 text-xs font-bold uppercase tracking-[.13em] text-primary-600">{t('Account recovery')}</p>
        <h1 className="font-bankco-display text-3xl font-semibold tracking-[-.045em] text-[#1a202c]">{t('Forgot password?')}</h1>
        <p className="mt-2 text-base font-medium text-[#718096]">{t("Enter your email and we'll send a reset link")}</p>
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

      <Button type="submit" className="w-full" loading={loading}>{t('Send reset link')}</Button>

      <p className="text-center text-sm text-[#718096]">
        <Link to="/login" className="font-bold text-primary-600 hover:text-primary-700">{t('Back to login')}</Link>
      </p>
    </form>
  )
}
