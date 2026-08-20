import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/features/auth/context/AuthProvider'
import {
  getDashboardPath,
  ROLES,
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD,
  isAdminEmail,
} from '@/shared/lib/constants'
import { env } from '@/shared/lib/env'
import { isDatabaseReady, getSqlEditorUrl } from '@/shared/lib/setupStatus'
import { loadCleaningDraft } from '@/shared/lib/bookingDraft'
import { trackEvent } from '@/shared/lib/analytics'
import { PROVIDER_PLATFORM_FEE_PERCENT } from '@/shared/lib/marketplaceConfig'
import { recordPwaEngagement } from '@/shared/lib/pwaEngagement'
import { getCleaningHourlyRateForDuration } from '@/shared/lib/cleaningContent'
import { PAGE_META, usePageMeta } from '@/shared/lib/pageMeta'
import { ServiceAreaPicker } from '@/features/auth/components/ServiceAreaPicker'
import { cn } from '@/shared/lib/utils'

const ROLE_LABELS = {
  customer: 'I need a cleaner',
  provider: 'I want to join as a service provider',
} as const

const STANDARD_PROVIDER_RATE = getCleaningHourlyRateForDuration(2)

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
  usePageMeta(PAGE_META.login)
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
        setTimeout(
          () =>
            resolve({
              error: 'Sign in timed out. Check your connection and try again.',
              role: null,
            }),
          20000,
        ),
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
      <h1 className="text-xl font-semibold text-slate-900">Log in</h1>
      <p className="mt-1 text-sm text-slate-500">Sign in with your Nexo account</p>

      <ConfigBanner />
      <DatabaseSetupBanner />

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" data-install-block="true">
        {success && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800" role="status">
            {success}
          </p>
        )}
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert" data-form-error>
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
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
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
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 pr-11 text-sm"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded text-slate-500 hover:text-slate-700"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="min-h-11 w-full rounded-lg bg-nexo-600 py-2.5 text-sm font-medium text-white hover:bg-nexo-700 disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Log in'}
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

type FieldKey =
  | 'fullName'
  | 'email'
  | 'phone'
  | 'listingType'
  | 'bio'
  | 'yearsExperience'
  | 'serviceAreas'
  | 'password'
  | 'workAuth'
  | 'terms'
  | 'businessName'

type FieldErrors = Partial<Record<FieldKey, string>>

const FIELD_IDS: Record<FieldKey, string> = {
  fullName: 'full-name',
  email: 'reg-email',
  phone: 'reg-phone',
  listingType: 'provider-type',
  bio: 'service-profile',
  yearsExperience: 'years-exp',
  serviceAreas: 'service-areas',
  password: 'reg-password',
  workAuth: 'work-auth',
  terms: 'accepted-terms',
  businessName: 'business-name',
}

export function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'customer' | 'provider'>(
    searchParams.get('role') === 'provider' ? 'provider' : 'customer',
  )
  const [listingType, setListingType] = useState<'individual' | 'company'>('individual')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [workAuth, setWorkAuth] = useState(false)
  const [businessName, setBusinessName] = useState('')
  const [bio, setBio] = useState('')
  const [yearsExperience, setYearsExperience] = useState('1')
  const [serviceAreas, setServiceAreas] = useState<string[]>([])
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [startedTracked, setStartedTracked] = useState(false)
  const summaryRef = useRef<HTMLDivElement>(null)

  usePageMeta(role === 'provider' ? PAGE_META.registerProvider : PAGE_META.registerCustomer)

  const inputClass = 'mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm'
  const formLocked = loading || Boolean(success)

  useEffect(() => {
    if (searchParams.get('role') === 'provider') setRole('provider')
  }, [searchParams])

  const trackRegistrationStarted = () => {
    if (startedTracked) return
    setStartedTracked(true)
    trackEvent('registration_started', { role })
  }

  const validate = (): FieldErrors => {
    const next: FieldErrors = {}
    if (!fullName.trim()) next.fullName = 'Enter your full name.'
    if (!isValidEmail(email)) next.email = 'Enter a valid email address.'
    if (!isValidSgMobile(phone)) next.phone = 'Enter a valid 8-digit Singapore mobile number.'
    if (password.length < 8) next.password = 'Use at least 8 characters for your password.'
    if (!acceptedTerms) {
      next.terms = 'Accept the Terms of Service and Privacy Policy to continue.'
    }
    if (role === 'provider') {
      if (!listingType) next.listingType = 'Choose how you will provide services.'
      if (listingType === 'company' && !businessName.trim()) {
        next.businessName = 'Enter your company name.'
      }
      if (!bio.trim()) next.bio = 'Describe your cleaning experience and services.'
      if (yearsExperience === '' || Number.isNaN(Number(yearsExperience)) || Number(yearsExperience) < 0) {
        next.yearsExperience = 'Enter your years of experience.'
      }
      if (serviceAreas.length === 0) next.serviceAreas = 'Select at least one service area.'
      if (!workAuth) {
        next.workAuth =
          'Confirm that you are legally permitted to provide services in Singapore.'
      }
    }
    return next
  }

  const focusField = (key: FieldKey) => {
    const el = document.getElementById(FIELD_IDS[key])
    el?.focus()
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    trackRegistrationStarted()

    const nextErrors = validate()
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      summaryRef.current?.focus()
      const order: FieldKey[] = [
        'fullName',
        'email',
        'phone',
        'listingType',
        'businessName',
        'bio',
        'yearsExperience',
        'serviceAreas',
        'password',
        'workAuth',
        'terms',
      ]
      const first = order.find((k) => nextErrors[k])
      if (first) focusField(first)
      return
    }

    setLoading(true)

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
      hourlyRate: role === 'provider' ? STANDARD_PROVIDER_RATE : undefined,
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
      setSuccess(
        `Account created. We sent a confirmation link to ${email}. Check your inbox, then log in.`,
      )
      return
    }
    if (signedUpRole) {
      const draft = loadCleaningDraft()
      navigate(draft ? '/services/cleaning/request' : getDashboardPath(signedUpRole))
      return
    }
    setSuccess('Account created. You can log in now.')
  }

  const errorEntries = (Object.entries(fieldErrors) as [FieldKey, string][]).filter(
    ([, msg]) => Boolean(msg),
  )

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Get started</h1>
      <p className="mt-1 text-sm text-slate-500">
        Create a Nexo account to request cleaning or join as a cleaning service provider.
      </p>

      <ConfigBanner />
      <DatabaseSetupBanner />

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-6 space-y-6"
        data-install-block="true"
      >
        {errorEntries.length > 0 && (
          <div
            ref={summaryRef}
            tabIndex={-1}
            role="alert"
            data-form-error
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-800"
          >
            <p className="font-medium">Please review the highlighted information.</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {errorEntries.map(([key, msg]) => (
                <li key={key}>
                  <button
                    type="button"
                    className="text-left underline"
                    onClick={() => focusField(key)}
                  >
                    {msg}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert" data-form-error>
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700" role="status">
            {success}
          </p>
        )}

        <section aria-labelledby="account-details-heading" className="space-y-4">
          <h2 id="account-details-heading" className="text-base font-semibold text-slate-900">
            1. Account details
          </h2>

          <div>
            <span id="role-label" className="block text-sm font-medium text-slate-700">
              I am
            </span>
            <div
              className="mt-2 grid gap-2 sm:grid-cols-2"
              role="radiogroup"
              aria-labelledby="role-label"
            >
              {([ROLES.CUSTOMER, ROLES.PROVIDER] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={role === r}
                  onClick={() => {
                    setRole(r)
                    trackRegistrationStarted()
                  }}
                  disabled={formLocked}
                  className={cn(
                    'min-h-11 rounded-lg border px-3 py-2.5 text-sm',
                    role === r
                      ? 'border-nexo-700 bg-nexo-50 text-nexo-700'
                      : 'border-slate-200 text-slate-600',
                  )}
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
                setFieldErrors((p) => ({ ...p, fullName: undefined }))
              }}
              className={cn(inputClass, fieldErrors.fullName && 'border-red-400')}
              aria-invalid={Boolean(fieldErrors.fullName)}
              aria-describedby={fieldErrors.fullName ? 'full-name-error' : undefined}
              disabled={formLocked}
            />
            {fieldErrors.fullName && (
              <p id="full-name-error" className="mt-1 text-xs text-red-600">
                {fieldErrors.fullName}
              </p>
            )}
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
              onChange={(e) => {
                setEmail(e.target.value)
                setFieldErrors((p) => ({ ...p, email: undefined }))
              }}
              className={cn(inputClass, fieldErrors.email && 'border-red-400')}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'reg-email-error' : undefined}
              disabled={formLocked}
            />
            {fieldErrors.email && (
              <p id="reg-email-error" className="mt-1 text-xs text-red-600">
                {fieldErrors.email}
              </p>
            )}
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
              onChange={(e) => {
                setPhone(e.target.value)
                setFieldErrors((p) => ({ ...p, phone: undefined }))
              }}
              placeholder="91234567"
              className={cn(inputClass, fieldErrors.phone && 'border-red-400')}
              aria-invalid={Boolean(fieldErrors.phone)}
              aria-describedby={fieldErrors.phone ? 'reg-phone-error' : undefined}
              disabled={formLocked}
            />
            {fieldErrors.phone && (
              <p id="reg-phone-error" className="mt-1 text-xs text-red-600">
                {fieldErrors.phone}
              </p>
            )}
          </div>

          {role === 'customer' && (
            <p className="text-sm text-slate-500">
              Your address is collected when you submit a cleaning request — not during registration.
            </p>
          )}
        </section>

        {role === 'provider' && (
          <>
            <section aria-labelledby="provider-type-heading" className="space-y-3">
              <h2 id="provider-type-heading" className="text-base font-semibold text-slate-900">
                2. Provider type
              </h2>
              <div
                id="provider-type"
                role="radiogroup"
                aria-labelledby="provider-type-heading"
                aria-invalid={Boolean(fieldErrors.listingType)}
                aria-describedby={
                  fieldErrors.listingType
                    ? 'provider-type-error'
                    : listingType === 'individual'
                      ? 'individual-help'
                      : 'company-help'
                }
                className="grid gap-2 sm:grid-cols-2"
              >
                {(['individual', 'company'] as const).map((type) => (
                  <label
                    key={type}
                    className={cn(
                      'flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 text-sm',
                      listingType === type
                        ? 'border-nexo-700 bg-nexo-50 text-nexo-800'
                        : 'border-slate-200 text-slate-700',
                    )}
                  >
                    <input
                      type="radio"
                      name="provider-type"
                      value={type}
                      checked={listingType === type}
                      onChange={() => {
                        setListingType(type)
                        setFieldErrors((p) => ({ ...p, listingType: undefined }))
                      }}
                      disabled={formLocked}
                      className="mt-1"
                    />
                    <span>
                      <span className="font-medium">
                        {type === 'individual'
                          ? 'Individual Service Provider'
                          : 'Cleaning Company'}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              {listingType === 'individual' ? (
                <p id="individual-help" className="text-sm text-slate-600">
                  Individual provider profiles are initially private. Nexo may match you with suitable
                  customer requests after your account has been reviewed.
                </p>
              ) : (
                <p id="company-help" className="text-sm text-slate-600">
                  Your approved company name and service information may appear publicly in customer
                  search results.
                </p>
              )}
              {fieldErrors.listingType && (
                <p id="provider-type-error" className="text-xs text-red-600">
                  {fieldErrors.listingType}
                </p>
              )}
              {listingType === 'company' && (
                <div>
                  <label htmlFor="business-name" className="block text-sm font-medium text-slate-700">
                    Company name
                  </label>
                  <input
                    id="business-name"
                    type="text"
                    value={businessName}
                    onChange={(e) => {
                      setBusinessName(e.target.value)
                      setFieldErrors((p) => ({ ...p, businessName: undefined }))
                    }}
                    placeholder="e.g. CleanPro SG Pte Ltd"
                    className={cn(inputClass, fieldErrors.businessName && 'border-red-400')}
                    aria-invalid={Boolean(fieldErrors.businessName)}
                    disabled={formLocked}
                  />
                  {fieldErrors.businessName && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.businessName}</p>
                  )}
                </div>
              )}
            </section>

            <section aria-labelledby="service-profile-heading" className="space-y-3">
              <h2 id="service-profile-heading" className="text-base font-semibold text-slate-900">
                3. Service profile
              </h2>
              <div>
                <label htmlFor="service-profile" className="block text-sm font-medium text-slate-700">
                  Service profile
                </label>
                <textarea
                  id="service-profile"
                  value={bio}
                  onChange={(e) => {
                    setBio(e.target.value)
                    setFieldErrors((p) => ({ ...p, bio: undefined }))
                  }}
                  rows={3}
                  placeholder="Tell customers about your cleaning experience, service approach and the types of homes you support."
                  className={cn(inputClass, fieldErrors.bio && 'border-red-400')}
                  aria-invalid={Boolean(fieldErrors.bio)}
                  aria-describedby={fieldErrors.bio ? 'service-profile-error' : undefined}
                  disabled={formLocked}
                />
                {fieldErrors.bio && (
                  <p id="service-profile-error" className="mt-1 text-xs text-red-600">
                    {fieldErrors.bio}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="years-exp" className="block text-sm font-medium text-slate-700">
                  Years of experience
                </label>
                <input
                  id="years-exp"
                  type="number"
                  min={0}
                  value={yearsExperience}
                  onChange={(e) => {
                    setYearsExperience(e.target.value)
                    setFieldErrors((p) => ({ ...p, yearsExperience: undefined }))
                  }}
                  className={cn(inputClass, fieldErrors.yearsExperience && 'border-red-400')}
                  aria-invalid={Boolean(fieldErrors.yearsExperience)}
                  disabled={formLocked}
                />
                {fieldErrors.yearsExperience && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.yearsExperience}</p>
                )}
              </div>
            </section>

            <section aria-labelledby="service-areas-heading" className="space-y-3">
              <h2 id="service-areas-heading" className="text-base font-semibold text-slate-900">
                4. Service areas
              </h2>
              <ServiceAreaPicker
                selected={serviceAreas}
                onChange={(areas) => {
                  setServiceAreas(areas)
                  setFieldErrors((p) => ({ ...p, serviceAreas: undefined }))
                }}
                disabled={formLocked}
                error={fieldErrors.serviceAreas}
              />
            </section>

            <section aria-labelledby="rate-heading" className="space-y-3">
              <h2 id="rate-heading" className="text-base font-semibold text-slate-900">
                5. Rate and availability
              </h2>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                <p>
                  Current Nexo standard cleaning rates are based on booking duration. Your payout is
                  calculated from the confirmed booking amount after the Nexo service fee.
                </p>
                <p className="mt-2">
                  Nexo deducts a {PROVIDER_PLATFORM_FEE_PERCENT}% service fee from the confirmed
                  service amount before releasing the provider payout. The booking summary will show
                  the service amount, Nexo fee and expected provider payout.
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Provider-specific rate exceptions are managed through the admin system.
                </p>
              </div>
            </section>
          </>
        )}

        <section aria-labelledby="agreement-heading" className="space-y-4">
          <h2 id="agreement-heading" className="text-base font-semibold text-slate-900">
            {role === 'provider' ? '6. Agreement and submission' : '2. Agreement and submission'}
          </h2>

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
                onChange={(e) => {
                  setPassword(e.target.value)
                  setFieldErrors((p) => ({ ...p, password: undefined }))
                }}
                onKeyUp={(e) => setCapsLock(e.getModifierState?.('CapsLock') ?? false)}
                onKeyDown={(e) => setCapsLock(e.getModifierState?.('CapsLock') ?? false)}
                className={cn(
                  'w-full rounded-lg border border-slate-200 px-3 py-2.5 pr-11 text-sm',
                  fieldErrors.password && 'border-red-400',
                )}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby="password-hint"
                disabled={formLocked}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded text-slate-500 hover:text-slate-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p id="password-hint" className="mt-1 text-xs text-slate-500">
              Use at least 8 characters.
            </p>
            {capsLock && (
              <p className="mt-1 text-xs font-medium text-amber-700" role="status">
                Caps Lock is on
              </p>
            )}
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
            )}
          </div>

          {role === 'provider' && (
            <div className="rounded-lg border border-nexo-200 bg-nexo-50 px-3 py-3 text-sm text-nexo-900">
              <p className="font-medium">Independent service provider</p>
              <p className="mt-1 text-nexo-800">
                Nexo connects independent cleaning service providers with customers. Joining Nexo
                does not create an employment relationship. You choose whether to accept available
                opportunities and remain responsible for complying with applicable tax, licensing and
                work-authorisation requirements.
              </p>
            </div>
          )}

          {role === 'provider' && (
            <label className="flex items-start gap-2 text-sm text-slate-600">
              <input
                id="work-auth"
                type="checkbox"
                checked={workAuth}
                onChange={(e) => {
                  setWorkAuth(e.target.checked)
                  setFieldErrors((p) => ({ ...p, workAuth: undefined }))
                }}
                disabled={formLocked}
                className="mt-1 rounded border-slate-300"
                aria-invalid={Boolean(fieldErrors.workAuth)}
                aria-describedby={fieldErrors.workAuth ? 'work-auth-error' : undefined}
              />
              <span>
                I confirm that I am legally permitted to provide paid services in Singapore and that
                the information I provide is accurate.
              </span>
            </label>
          )}
          {fieldErrors.workAuth && (
            <p id="work-auth-error" className="text-xs text-red-600">
              {fieldErrors.workAuth}
            </p>
          )}

          <label className="flex items-start gap-2 text-sm text-slate-600">
            <input
              id="accepted-terms"
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => {
                setAcceptedTerms(e.target.checked)
                setFieldErrors((p) => ({ ...p, terms: undefined }))
              }}
              disabled={formLocked}
              className="mt-1 rounded border-slate-300"
              aria-invalid={Boolean(fieldErrors.terms)}
              aria-describedby={fieldErrors.terms ? 'terms-error' : undefined}
            />
            <span>
              I agree to the{' '}
              <Link to="/terms" className="font-medium text-nexo-700 hover:underline" target="_blank">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                to="/privacy"
                className="font-medium text-nexo-700 hover:underline"
                target="_blank"
              >
                Privacy Policy
              </Link>
              {role === 'provider' && (
                <>
                  , and I understand Nexo deducts {PROVIDER_PLATFORM_FEE_PERCENT}% service fee from
                  each confirmed service amount before payout
                </>
              )}
              .
            </span>
          </label>
          {fieldErrors.terms && (
            <p id="terms-error" className="text-xs text-red-600">
              {fieldErrors.terms}
            </p>
          )}

          <button
            type="submit"
            disabled={formLocked}
            className="min-h-11 w-full rounded-lg bg-nexo-600 py-2.5 text-sm font-medium text-white hover:bg-nexo-700 disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </section>
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
