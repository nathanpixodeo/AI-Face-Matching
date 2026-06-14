import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { api } from '../lib/api'
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'

export default function ResetPassword() {
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
      setError(err instanceof Error ? err.message : 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
          <CheckCircle className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Password reset</h1>
        <p className="text-sm text-gray-500">Your password has been updated. Redirecting to login...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Set new password</h1>
        <p className="text-sm text-gray-500 mt-1">Enter your new password below</p>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>}

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">New password</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Lock className="w-4 h-4" />
          </div>
          <input
            type={showPw ? 'text' : 'password'}
            placeholder="Min 8 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 bg-white pl-10 pr-10 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            required
            minLength={8}
          />
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <Button type="submit" className="w-full" loading={loading}>Reset password</Button>

      <p className="text-center text-sm text-gray-500">
        <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">Back to login</Link>
      </p>
    </form>
  )
}
