import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supportContactService } from '@/shared/services/supportContactService'
import { PAGE_META, usePageMeta } from '@/shared/lib/pageMeta'
import { cn } from '@/shared/lib/utils'

const SUBJECT_CATEGORIES = [
  'Booking request',
  'Existing booking',
  'Payment or refund',
  'Service issue',
  'Provider registration',
  'Account access',
  'Privacy request',
  'Other',
] as const

export function SupportContactPage() {
  usePageMeta(PAGE_META.support)
  const [searchParams] = useSearchParams()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [category, setCategory] = useState<(typeof SUBJECT_CATEGORIES)[number] | ''>('')
  const [subjectDetail, setSubjectDetail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [successId, setSuccessId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const presetSubject = searchParams.get('subject')
    if (!presetSubject) return
    const match = SUBJECT_CATEGORIES.find(
      (c) => c.toLowerCase() === presetSubject.toLowerCase(),
    )
    if (match) setCategory(match)
    else {
      setCategory('Other')
      setSubjectDetail(presetSubject)
    }
  }, [searchParams])

  const inputClass =
    'mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-nexo-500 focus:outline-none focus:ring-2 focus:ring-nexo-500/20'

  const composedSubject =
    category === 'Other' && subjectDetail.trim()
      ? `Other: ${subjectDetail.trim()}`
      : category || subjectDetail.trim()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setError('')

    if (!category) {
      setError('Select a subject category.')
      return
    }
    if (category === 'Other' && subjectDetail.trim().length < 3) {
      setError('Enter a short subject for your request.')
      return
    }

    setLoading(true)
    try {
      const { data, error: err } = await supportContactService.submit({
        fullName,
        email,
        phone: phone || undefined,
        subject: composedSubject,
        message,
      })
      if (err) {
        setError(err)
        return
      }
      setSuccessId(data?.id ?? 'submitted')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl pb-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Contact Nexo</h1>
        <p className="mt-2 text-slate-600">
          Questions about home cleaning bookings, your account, or joining as a cleaning service
          provider? Send us a message and our team will get back to you.
        </p>
      </header>

      {successId ? (
        <div
          className="rounded-xl border border-green-200 bg-green-50 px-5 py-6 text-center"
          role="status"
        >
          <p className="font-semibold text-green-900">Message sent</p>
          <p className="mt-2 text-sm text-green-800">
            Thank you — we received your message
            {successId !== 'submitted' ? (
              <>
                {' '}
                (reference <span className="font-mono text-xs">{successId}</span>)
              </>
            ) : null}
            . We will reply to your email as soon as we can.
          </p>
          <Link
            to="/"
            className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-nexo-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-nexo-800"
          >
            Back to home
          </Link>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          data-install-block="true"
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-6"
        >
          {error && (
            <p
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
              data-form-error
            >
              {error}
            </p>
          )}

          <label className="block text-sm">
            <span className="font-medium text-slate-700">Full name</span>
            <input
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
              required
              disabled={loading}
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-slate-700">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              required
              disabled={loading}
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-slate-700">Mobile (optional)</span>
            <input
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="91234567"
              pattern="[689]\d{7}"
              className={inputClass}
              disabled={loading}
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-slate-700">Subject</span>
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as (typeof SUBJECT_CATEGORIES)[number] | '')
              }
              className={inputClass}
              required
              disabled={loading}
            >
              <option value="">Select a category</option>
              {SUBJECT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          {category === 'Other' && (
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Subject details</span>
              <input
                type="text"
                value={subjectDetail}
                onChange={(e) => setSubjectDetail(e.target.value)}
                className={inputClass}
                required
                minLength={3}
                disabled={loading}
              />
            </label>
          )}

          {category === 'Privacy request' && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              Do not include passwords, payment credentials or identity-document numbers in this form.
            </p>
          )}

          <label className="block text-sm">
            <span className="font-medium text-slate-700">Message</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className={cn(inputClass, 'resize-y')}
              required
              minLength={10}
              disabled={loading}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="min-h-11 w-full rounded-lg bg-nexo-700 py-2.5 text-sm font-medium text-white hover:bg-nexo-800 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nexo-600"
          >
            {loading ? 'Sending…' : 'Send message'}
          </button>
        </form>
      )}
    </div>
  )
}
