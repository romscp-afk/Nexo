import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/features/auth/context/AuthProvider'
import { getDashboardPath, ROLES, SINGAPORE_AREAS, DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD, isAdminEmail } from '@/shared/lib/constants'
import { env } from '@/shared/lib/env'
import { isDatabaseReady, getSqlEditorUrl } from '@/shared/lib/setupStatus'
import { loadCleaningDraft } from '@/shared/lib/bookingDraft'
import { trackEvent } from '@/shared/lib/analytics'
import { PROVIDER_LISTING_TYPE_LABELS } from '@/shared/lib/providerListing'
import { PROVIDER_PLATFORM_FEE_PERCENT } from '@/shared/lib/marketplaceConfig'
import { recordPwaEngagement } from '@/shared/lib/pwaEngagement'

const ROLE_LABELS = {
  customer: 'I need a cleaner',
  provider: 'I provide cleaning services',
} as const

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function isValidSgMobile(phone: string) {
  return /^[689]\d{7}$/.test(phone.replace(/\s+/g, ''))
}

function postAuthPath(from?: string) {
  const draft = loadCleaningDraft()
  if (from) return from
  if (draft) return '/services/cleaning/request'
  return null
}

function DatabaseSetupBanner() {
  const [ready, setReady] = useState<boolean | null>(null)

  useEffect(() => {
    if (!env.isConfigured) return
    void isDatabaseReady().then(setReady)
  }, [])

  if (!env.isConfigured || ready !== false) return null

  return (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
      <p className="font-medium">Database schema not applied yet</p>
      <p className="mt-1">
        Run <code className="text-xs">node scripts/apply-schema.mjs</code> or paste{' '}
        <code className="text-xs">supabase/schema.sql</code> in the{' '}
        <a href={getSqlEditorUrl()} target="_blank" rel="noreferrer" className="underline">
          Supabase SQL Editor
        </a>
        . Register/login will fail until this is done.
      </p>
    </div>
  )
}

function ConfigBanner() {
  if (env.isConfigured) return null
  return (
    <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
      Supabase is not configured. Copy <code className="text-xs">.env.example</code> to{' '}
      <code className="text-xs">.env</code> and add your project credentials.
    </p>
  )
}

function AdminLoginHelp({
  error,
  onCreateAdmin,
  creating,
}: {
  error: string
  onCreateAdmin: () => void
  creating: boolean
}) {
  const isNetwork =
    /cannot reach supabase|connection|timed out|load failed|failed to fetch/i.test(error)

  if (isNetwork) {
    return (
      <span className="mt-2 block text-xs text-red-600">
        Network error — confirm <code className="text-[11px]">.env</code> has your Supabase URL/key,
        restart the dev server (<code className="text-[11px]">npm run dev</code>), and try again.
      </span>
    )
  }

  return (
    <span className="mt-2 block space-y-2 text-xs text-red-600">
      <span className="block font-medium">Admin account does not exist yet.</span>
      <button
        type="button"
        onClick={onCreateAdmin}
        disabled={creating}
        className="rounded-md bg-nexo-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-nexo-800 disabled:opacity-50"
      >
        {creating ? 'Creating admin…' : 'Create admin account (one click)'}
      </button>
      <span className="block text-slate-600">
        Requires <code className="text-[11px]">schema.sql</code> run once in SQL Editor. Manual
        option: Dashboard → Authentication → Add user → then{' '}
        <code className="text-[11px]">promote-admin.sql</code>.
      </span>
      <a href={getSqlEditorUrl()} target="_blank" rel="noreferrer" className="underline">
        Open SQL Editor
      </a>
    </span>
  )
}

export function LoginPage() {
  const { signIn, setupDemoAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [creatingAdmin, setCreatingAdmin] = useState(false)

  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname

  const handleCreateAdmin = async () => {
    setError('')
    setSuccess('')
    setCreatingAdmin(true)
    try {
      const { error: err, role, message } = await setupDemoAdmin()
      if (err) {
        setError(err)
        return
      }
      if (message) {
        setSuccess(message)
        setEmail(DEMO_ADMIN_EMAIL)
        setPassword(DEMO_ADMIN_PASSWORD)
        return
      }
      if (role) {
        const next = postAuthPath(fromPath) ?? getDashboardPath(role)
        navigate(next)
      }
    } finally {
      setCreatingAdmin(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const signInPromise = signIn(email, password)
      const timeoutPromise = new Promise<{ error: string; role: null }>((resolve) =>
        setTimeout(() => resolve({ error: 'Sign in timed out. Check your connection and try again.', role: null }), 20000),
      )
      const { error: err, role } = await Promise.race([signInPromise, timeoutPromise])
      if (err) {
        setError(err)
        return
      }
      const next = postAuthPath(fromPath) ?? getDashboardPath(role ?? 'customer')
      navigate(next)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900">Log in</h2>
      <p className="mt-1 text-sm text-slate-500">Sign in with your Nexo account</p>

      <ConfigBanner />
      <DatabaseSetupBanner />

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {success && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800" role="status">
            {success}
          </p>
        )}
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
            {env.isDev && isAdminEmail(email) && (
              <AdminLoginHelp
                error={error}
                onCreateAdmin={handleCreateAdmin}
                creating={creatingAdmin}
              />
            )}
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
          <div className="relative mt-1">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-10 text-sm"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-700"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-nexo-700 py-2 text-sm font-medium text-white hover:bg-nexo-800 disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        No account?{' '}
        <Link to="/register" className="font-medium text-nexo-700 hover:underline">
          Register
        </Link>
      </p>
    </div>
  )
}

export function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'customer' | 'provider'>(
    searchParams.get('role') === 'provider' ? 'provider' : 'customer',
  )
  const [listingType, setListingType] = useState<'individual' | 'company'>('individual')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [businessName, setBusinessName] = useState('')
  const [bio, setBio] = useState('')
  const [yearsExperience, setYearsExperience] = useState('1')
  const [hourlyRate, setHourlyRate] = useState('40')
  const [serviceAreas, setServiceAreas] = useState<string[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [startedTracked, setStartedTracked] = useState(false)

  const inputClass = 'mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm'
  const formLocked = loading || Boolean(success)

  useEffect(() => {
    if (searchParams.get('role') === 'provider') setRole('provider')
  }, [searchParams])

  const trackRegistrationStarted = () => {
    if (startedTracked) return
    setStartedTracked(true)
    trackEvent('registration_started', { role })
  }

  const toggleServiceArea = (area: string) => {
    setServiceAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area],
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    trackRegistrationStarted()

    if (!isValidEmail(email)) {
      setError('Enter a valid email address.')
      return
    }
    if (!isValidSgMobile(phone)) {
      setError('Enter a valid Singapore mobile number (8 digits starting with 6, 8 or 9).')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (!acceptedTerms) {
      setError('Please accept the Terms of Service and Privacy Policy.')
      return
    }

    if (role === 'provider' && listingType === 'company' && !businessName.trim()) {
      setError('Enter your company name.')
      return
    }

    setLoading(true)

    if (role === 'provider' && serviceAreas.length === 0) {
      setError('Select at least one service area you cover.')
      setLoading(false)
      return
    }

    const { error: err, needsEmailConfirmation, role: signedUpRole } = await signUp({
      email,
      password,
      role,
      fullName,
      phone,
      businessName:
        role === 'provider'
          ? listingType === 'company'
            ? businessName.trim()
            : businessName.trim() || fullName
          : undefined,
      listingType: role === 'provider' ? listingType : undefined,
      bio: role === 'provider' ? bio : undefined,
      yearsExperience: role === 'provider' ? Number(yearsExperience) || 0 : undefined,
      hourlyRate: role === 'provider' ? Number(hourlyRate) || 0 : undefined,
      serviceAreas: role === 'provider' ? serviceAreas : undefined,
    })
    setLoading(false)
    if (err) {
      setError(err)
      return
    }
    trackEvent('registration_completed', { role })
    recordPwaEngagement()
    if (needsEmailConfirmation) {
      setSuccess(`Account created. We sent a confirmation link to ${email}. Check your inbox, then log in.`)
      return
    }
    if (signedUpRole) {
      const draft = loadCleaningDraft()
      navigate(draft ? '/services/cleaning/request' : getDashboardPath(signedUpRole))
      return
    }
    setSuccess('Account created. You can log in now.')
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900">Get started</h2>
      <p className="mt-1 text-sm text-slate-500">
        Create a Nexo account to request cleaning or join as a cleaning professional.
      </p>

      <ConfigBanner />
      <DatabaseSetupBanner />

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
          <span className="block text-sm font-medium text-slate-700">I am</span>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {([ROLES.CUSTOMER, ROLES.PROVIDER] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setRole(r)
                  trackRegistrationStarted()
                }}
                disabled={loading}
                className={`min-h-11 rounded-lg border px-3 py-2.5 text-sm ${
                  role === r
                    ? 'border-nexo-700 bg-nexo-50 text-nexo-700'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                {ROLE_LABELS[r]}
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
            onChange={(e) => {
              setFullName(e.target.value)
              trackRegistrationStarted()
            }}
            className={inputClass}
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
            className={inputClass}
            required
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="reg-phone" className="block text-sm font-medium text-slate-700">
            Mobile (Singapore)
          </label>
          <input
            id="reg-phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="91234567"
            pattern="[689]\d{7}"
            className={inputClass}
            required
            disabled={loading}
          />
        </div>
        {role === 'provider' && (
          <div>
            <span className="block text-sm font-medium text-slate-700">Listing as</span>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {(['individual', 'company'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setListingType(type)}
                  disabled={loading}
                  className={`min-h-11 rounded-lg border px-3 py-2.5 text-left text-sm ${
                    listingType === type
                      ? 'border-nexo-700 bg-nexo-50 text-nexo-700'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="font-medium">{PROVIDER_LISTING_TYPE_LABELS[type]}</span>
                  <span className="mt-0.5 block text-xs opacity-80">
                    {type === 'company' ? 'Public company name' : 'Hidden from public site'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
        {role === 'provider' && listingType === 'company' && (
          <div>
            <label htmlFor="business-name" className="block text-sm font-medium text-slate-700">
              Company name
            </label>
            <input
              id="business-name"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. CleanPro SG Pte Ltd"
              className={inputClass}
              required
              disabled={loading}
            />
          </div>
        )}
        {role === 'provider' && listingType === 'individual' && (
          <p className="text-sm text-slate-500">
            Individual cleaners are not listed by name on the public website. You can switch to a
            company listing later from your provider profile.
          </p>
        )}
        {role === 'customer' && (
          <p className="text-sm text-slate-500">
            Your address is collected when you submit a cleaning request — not during registration.
          </p>
        )}
        {role === 'provider' && (
          <>
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-slate-700">
                Business bio
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Brief description of your services…"
                className={inputClass}
                disabled={loading}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="years-exp" className="block text-sm font-medium text-slate-700">
                  Years experience
                </label>
                <input
                  id="years-exp"
                  type="number"
                  min={0}
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                  className={inputClass}
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="hourly-rate" className="block text-sm font-medium text-slate-700">
                  Hourly rate (SGD)
                </label>
                <input
                  id="hourly-rate"
                  type="number"
                  min={0}
                  step={1}
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className={inputClass}
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <fieldset>
              <legend className="text-sm font-medium text-slate-700">Service areas covered</legend>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {SINGAPORE_AREAS.map((area) => (
                  <label key={area} className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={serviceAreas.includes(area)}
                      onChange={() => toggleServiceArea(area)}
                      disabled={loading}
                      className="rounded border-slate-300"
                    />
                    {area}
                  </label>
                ))}
              </div>
            </fieldset>
          </>
        )}
        <div>
          <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <div className="relative mt-1">
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-10 text-sm"
              minLength={6}
              required
              disabled={loading}
              aria-describedby="password-hint"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-700"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p id="password-hint" className="mt-1 text-xs text-slate-500">
            At least 6 characters
          </p>
        </div>
        {role === 'provider' && (
          <div className="rounded-lg border border-nexo-200 bg-nexo-50 px-3 py-3 text-sm text-nexo-900">
            <p className="font-medium">Platform fee</p>
            <p className="mt-1 text-nexo-800">
              Customers pay Nexo for each job. Nexo deducts a {PROVIDER_PLATFORM_FEE_PERCENT}%
              platform fee from the job amount before releasing the remaining payment to you.
            </p>
          </div>
        )}
        <label className="flex items-start gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            required
            disabled={loading}
            className="mt-1 rounded border-slate-300"
          />
          <span>
            I agree to the{' '}
            <Link to="/terms" className="font-medium text-nexo-700 hover:underline" target="_blank">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="font-medium text-nexo-700 hover:underline" target="_blank">
              Privacy Policy
            </Link>
            {role === 'provider' && (
              <>
                , and I understand Nexo deducts {PROVIDER_PLATFORM_FEE_PERCENT}% from each job
                before payout
              </>
            )}
            .
          </span>
        </label>
        <button
          type="submit"
          disabled={formLocked}
          className="w-full rounded-lg bg-nexo-600 py-2 text-sm font-medium text-white hover:bg-nexo-700 disabled:opacity-50"
        >
          {loading ? 'Creating…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Have an account?{' '}
        <Link to="/login" className="font-medium text-nexo-700 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}
