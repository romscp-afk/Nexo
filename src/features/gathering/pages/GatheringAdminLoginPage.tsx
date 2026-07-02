import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Lock, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/features/auth/context/AuthProvider'
import { EVENT, GATHERING_ADMIN_USERNAME, resolveGatheringAdminLogin } from '@/features/gathering/lib/eventConfig'
import { legacyTheme } from '@/features/gathering/lib/legacyTheme'

export function GatheringAdminLoginPage() {
  const { user, signIn, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/contact/report'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate(from, { replace: true })
    }
  }, [user, from, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: signInError, role } = await signIn(resolveGatheringAdminLogin(username), password)
      if (signInError) {
        setError(signInError)
        return
      }
      if (role !== 'admin') {
        await signOut()
        setError('Admin access only. Please use an administrator account.')
        return
      }
      navigate(from, { replace: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className={`overflow-hidden ${legacyTheme.card}`}>
        <div className="border-b border-legacy-silver/15 bg-gradient-to-r from-legacy-800 via-legacy-900 to-legacy-950 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-legacy-gold/20 text-legacy-gold">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h1 className={`text-lg ${legacyTheme.heading}`}>Admin Login</h1>
              <p className="text-sm text-legacy-silver">{EVENT.title} — Survey Report</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <p className="text-sm text-legacy-silver">
            Sign in with your administrator account to view survey responses and export the Excel report.
          </p>

          {error && (
            <p className="rounded-xl border border-legacy-red/40 bg-legacy-red/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <label className={legacyTheme.label}>
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={legacyTheme.input}
              autoComplete="username"
              placeholder={GATHERING_ADMIN_USERNAME}
              required
              disabled={loading}
            />
          </label>

          <label className={legacyTheme.label}>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={legacyTheme.input}
              autoComplete="current-password"
              required
              disabled={loading}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className={`inline-flex w-full items-center justify-center gap-2 disabled:opacity-60 ${legacyTheme.btnPrimary}`}
          >
            <Lock className="h-4 w-4" />
            {loading ? 'Signing in…' : 'Sign in to Report'}
          </button>

          <p className="text-center text-sm text-legacy-silver">
            <Link to="/contact" className="font-medium text-legacy-gold hover:underline">
              ← Back to home
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
