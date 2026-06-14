import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { api } from '../lib/api'
import { Mail, ArrowLeft } from 'lucide-react'

export default function ForgotPassword() {
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
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mx-auto">
          <Mail className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
        <p className="text-sm text-gray-500">If an account with that email exists, we've sent a reset link.</p>
        <Link to="/login" className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-500">
          <ArrowLeft className="w-4 h-4" /> Back to login
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Forgot password</h1>
        <p className="text-sm text-gray-500 mt-1">Enter your email and we'll send you a reset link</p>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>}

      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        icon={<Mail className="w-4 h-4" />}
        required
      />

      <Button type="submit" className="w-full" loading={loading}>Send reset link</Button>

      <p className="text-center text-sm text-gray-500">
        <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">Back to login</Link>
      </p>
    </form>
  )
}
