import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Eye, EyeOff } from 'lucide-react'
import { useI18n } from '../i18n/locale'

export default function Register() {
  const { register } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', team_name: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [field]: e.target.value })
  }

  function strength(pw: string): { pct: number; label: string; color: string } {
    if (pw.length < 4) return { pct: 0, label: '', color: '' }
    if (pw.length < 6) return { pct: 25, label: t('Weak'), color: 'bg-red-500' }
    if (pw.length < 8) return { pct: 50, label: t('Fair'), color: 'bg-yellow-500' }
    if (pw.length < 10) return { pct: 75, label: t('Good'), color: 'bg-primary-500' }
    return { pct: 100, label: t('Strong'), color: 'bg-green-500' }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      navigate('/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('Registration failed'))
    } finally {
      setLoading(false)
    }
  }

  const pw = strength(form.password)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-8 text-center">
        <p className="mb-3 text-xs font-bold uppercase tracking-[.13em] text-primary-600">{t('New workspace')}</p>
        <h1 className="font-bankco-display text-3xl font-semibold tracking-[-.045em] text-[#1a202c]">{t('Create your account.')}</h1>
        <p className="mt-2 text-base font-medium text-[#718096]">{t('Set up FaceMatch for your team')}</p>
      </div>

      {error && <div className="rounded-lg border border-[#fcDEDE] bg-[#fff7f7] px-4 py-3 text-sm font-medium text-[#dd3333]">{error}</div>}

      <div className="grid grid-cols-2 gap-3">
        <Input label={t('First Name')} placeholder="John" value={form.first_name} onChange={update('first_name')} required />
        <Input label={t('Last Name')} placeholder="Doe" value={form.last_name} onChange={update('last_name')} required />
      </div>

      <Input label={t('Email')} type="email" placeholder="you@example.com" value={form.email} onChange={update('email')} required />
      <Input label={t('Team Name')} placeholder="My Team" value={form.team_name} onChange={update('team_name')} required />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-[#4a5568]">{t('Password')}</label>
        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'}
            placeholder={t('Min 8 characters')}
            value={form.password}
            onChange={update('password')}
            className="block min-h-14 w-full rounded-lg border border-[#e2e8f0] bg-white py-3.5 pl-4 pr-11 text-base text-[#2d3748] placeholder:text-[#a0aec0] focus:border-primary-500 focus:outline-none"
            required
            minLength={8}
          />
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#a0aec0] hover:text-[#4a5568]">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {form.password && (
          <div className="flex items-center gap-2 mt-1">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#edf2f7]">
              <div className={`h-full rounded-full transition-all ${pw.color}`} style={{ width: `${pw.pct}%` }} />
            </div>
            <span className="text-xs font-medium text-[#718096]">{pw.label}</span>
          </div>
        )}
      </div>

      <Button type="submit" className="w-full" loading={loading}>{t('Create account')}</Button>

      <p className="pt-1 text-center text-sm text-[#718096]">
        {t('Already have an account?')}{' '}
        <Link to="/login" className="font-bold text-primary-600 hover:text-primary-700">{t('Sign in')}</Link>
      </p>
    </form>
  )
}
