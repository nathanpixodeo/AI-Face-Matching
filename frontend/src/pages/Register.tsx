import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Eye, EyeOff } from 'lucide-react'

export default function Register() {
  const { register } = useAuth()
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
    if (pw.length < 6) return { pct: 25, label: 'Weak', color: 'bg-red-500' }
    if (pw.length < 8) return { pct: 50, label: 'Fair', color: 'bg-yellow-500' }
    if (pw.length < 10) return { pct: 75, label: 'Good', color: 'bg-primary-500' }
    return { pct: 100, label: 'Strong', color: 'bg-green-500' }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      navigate('/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const pw = strength(form.password)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
        <p className="text-sm text-gray-500 mt-1">Get started with FaceMatch</p>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-2 gap-3">
        <Input label="First Name" placeholder="John" value={form.first_name} onChange={update('first_name')} required />
        <Input label="Last Name" placeholder="Doe" value={form.last_name} onChange={update('last_name')} required />
      </div>

      <Input label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={update('email')} required />
      <Input label="Team Name" placeholder="My Team" value={form.team_name} onChange={update('team_name')} required />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Password</label>
        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'}
            placeholder="Min 8 characters"
            value={form.password}
            onChange={update('password')}
            className="block w-full rounded-lg border border-gray-300 bg-white pr-10 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            required
            minLength={8}
          />
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {form.password && (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${pw.color}`} style={{ width: `${pw.pct}%` }} />
            </div>
            <span className="text-xs text-gray-500">{pw.label}</span>
          </div>
        )}
      </div>

      <Button type="submit" className="w-full" loading={loading}>Create account</Button>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">Sign in</Link>
      </p>
    </form>
  )
}
