import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthProvider'
import { getDashboardPath, ROLES } from '@/shared/lib/constants'
import { env } from '@/shared/lib/env'

function ConfigBanner() {
  if (env.isConfigured) return null
  return (
    <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
      Supabase is not configured. Copy <code className="text-xs">.env.example</code> to{' '}
      <code className="text-xs">.env</code> and add your project credentials.
    </p>
  )
}

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err, role } = await signIn(email, password)
    setLoading(false)
    if (err) {
      setError(err)
      return
    }
    navigate(getDashboardPath(role ?? 'customer'))
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900">Log in</h2>
      <p className="mt-1 text-sm text-slate-500">Sign in with your Nexo account</p>

      <ConfigBanner />

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            required
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-teal-700 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        No account?{' '}
        <Link to="/register" className="font-medium text-teal-700 hover:underline">
          Register
        </Link>
      </p>
    </div>
  )
}

export function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'customer' | 'provider'>('customer')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    const { error: err, needsEmailConfirmation } = await signUp({
      email,
      password,
      role,
      fullName,
      businessName: role === 'provider' ? fullName : undefined,
    })
    setLoading(false)
    if (err) {
      setError(err)
      return
    }
    if (needsEmailConfirmation) {
      setSuccess('Account created. Check your email to confirm, then log in.')
      return
    }
    setSuccess('Account created successfully. Redirecting to login…')
    setTimeout(() => navigate('/login'), 1500)
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900">Create account</h2>
      <p className="mt-1 text-sm text-slate-500">Join Nexo as a customer or service provider</p>

      <ConfigBanner />

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700" role="status">
            {success}
          </p>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700">I am a</label>
          <div className="mt-2 flex gap-2">
            {([ROLES.CUSTOMER, ROLES.PROVIDER] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                disabled={loading}
                className={`flex-1 rounded-lg border py-2 text-sm capitalize ${
                  role === r
                    ? 'border-teal-700 bg-teal-50 text-teal-700'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="full-name" className="block text-sm font-medium text-slate-700">
            Full name
          </label>
          <input
            id="full-name"
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="reg-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            minLength={6}
            required
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || Boolean(success)}
          className="w-full rounded-lg bg-teal-700 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
        >
          {loading ? 'Creating…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Have an account?{' '}
        <Link to="/login" className="font-medium text-teal-700 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}
