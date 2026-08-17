import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supportContactService } from '@/shared/services/supportContactService'
import { cn } from '@/shared/lib/utils'

export function SupportContactPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const inputClass =
    'mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-nexo-500 focus:outline-none focus:ring-2 focus:ring-nexo-500/20'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error: err } = await supportContactService.submit({
        fullName,
        email,
        phone: phone || undefined,
        subject,
        message,
      })
      if (err) {
        setError(err)
        return
      }
      setSuccess(true)
      setFullName('')
      setEmail('')
      setPhone('')
      setSubject('')
      setMessage('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl pb-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Contact Nexo</h1>
        <p className="mt-2 text-slate-600">
          Questions about home cleaning bookings, your account, or becoming a cleaning professional?
          Send us a message and our team will get back to you.
        </p>
      </header>

      {success ? (
        <div
          className="rounded-xl border border-green-200 bg-green-50 px-5 py-6 text-center"
          role="status"
        >
          <p className="font-semibold text-green-900">Message sent</p>
          <p className="mt-2 text-sm text-green-800">
            Thank you — we received your message and notified our team. We will reply to your email
            as soon as we can.
          </p>
          <Link
            to="/"
            className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-nexo-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-nexo-800"
          >
            Back to home
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
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
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={inputClass}
              required
              minLength={3}
              disabled={loading}
            />
          </label>

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
