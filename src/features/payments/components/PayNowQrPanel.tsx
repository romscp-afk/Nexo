import { useEffect, useState } from 'react'
import { Check, Copy, QrCode } from 'lucide-react'
import { buildPayNowPayload, payNowPayloadToDataUrl } from '@/shared/lib/paynow'
import { formatCurrency, formatDateTime } from '@/shared/lib/utils'
import {
  PAYMENT_KIND_LABELS,
  PAYMENT_STATUS_LABELS,
  type Payment,
  type PaymentStatus,
} from '@/shared/types/payment'
import type { Booking } from '@/shared/types/booking'
import { useSubmitPayment, useSubmitProviderAdminFee } from '@/features/payments/hooks/usePayments'

type PayNowQrPanelProps = {
  payment: Payment
  booking: Booking
  role: 'customer' | 'provider' | 'admin'
}

function statusTone(status: PaymentStatus): string {
  switch (status) {
    case 'paid':
      return 'bg-emerald-50 text-emerald-800 ring-emerald-200'
    case 'submitted':
      return 'bg-amber-50 text-amber-800 ring-amber-200'
    default:
      return 'bg-slate-50 text-slate-700 ring-slate-200'
  }
}

export function PayNowQrPanel({ payment, booking, role }: PayNowQrPanelProps) {
  const submitCustomer = useSubmitPayment()
  const submitProvider = useSubmitProviderAdminFee()
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const isAdminFee = payment.paymentKind === 'provider_admin_fee'
  const canShowQr =
    (role === 'customer' && !isAdminFee && ['pending', 'submitted'].includes(payment.status)) ||
    (role === 'provider' && isAdminFee && ['pending', 'submitted'].includes(payment.status))

  useEffect(() => {
    if (!canShowQr) {
      setQrDataUrl(null)
      return
    }
    let cancelled = false
    const payload = buildPayNowPayload({
      mobile: payment.paynowMobile,
      amount: payment.amount,
      reference: payment.reference,
    })
    void payNowPayloadToDataUrl(payload).then((url) => {
      if (!cancelled) setQrDataUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [canShowQr, payment.amount, payment.paynowMobile, payment.reference])

  const copyReference = async () => {
    await navigator.clipboard.writeText(payment.reference)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async () => {
    setError('')
    try {
      if (isAdminFee) {
        await submitProvider.mutateAsync({ paymentId: payment.id, note: note.trim() || undefined })
      } else {
        await submitCustomer.mutateAsync({ paymentId: payment.id, note: note.trim() || undefined })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit payment')
    }
  }

  const submitting = submitCustomer.isPending || submitProvider.isPending
  const canSubmit =
    (role === 'customer' && !isAdminFee && payment.status === 'pending') ||
    (role === 'provider' && isAdminFee && payment.status === 'pending')

  return (
    <section
      className={`rounded-xl border p-6 ${
        isAdminFee ? 'border-amber-300 bg-amber-50/50' : 'border-teal-200 bg-teal-50/40'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-slate-900">
            <QrCode className="h-5 w-5 text-teal-700" />
            {PAYMENT_KIND_LABELS[payment.paymentKind]}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {isAdminFee
              ? 'Pay platform admin fee via PayNow to receive customer contact details.'
              : 'Scan with any Singapore banking app. Payment is required in advance.'}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${statusTone(payment.status)}`}>
          {PAYMENT_STATUS_LABELS[payment.status]}
        </span>
      </div>

      <dl className="mt-4 grid gap-3 rounded-lg bg-white p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">Amount</dt>
          <dd className="text-lg font-bold text-teal-800">{formatCurrency(payment.amount)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">PayNow</dt>
          <dd className="font-medium">{payment.paynowMobile}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Reference</dt>
          <dd className="flex items-center gap-2 font-mono text-xs font-medium">
            {payment.reference}
            <button type="button" onClick={() => void copyReference()} className="rounded p-1 text-teal-700 hover:bg-teal-50" aria-label="Copy reference">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Service</dt>
          <dd className="font-medium">{booking.serviceName ?? '—'}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-slate-500">Booking</dt>
          <dd className="font-medium">
            {formatDateTime(booking.scheduledAt)} · {booking.addressLine1}, {booking.postalCode}
          </dd>
        </div>
      </dl>

      {canShowQr && qrDataUrl && (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-lg bg-white p-4">
          <img src={qrDataUrl} alt="PayNow QR code" className="h-56 w-56 rounded-lg border border-slate-200" />
        </div>
      )}

      {canSubmit && (
        <div className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Note after paying (optional)</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="e.g. Paid via DBS PayNow"
            />
          </label>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'I have paid via PayNow'}
          </button>
        </div>
      )}

      {payment.status === 'submitted' && (role === 'customer' || role === 'provider') && (
        <p className="mt-4 text-sm text-amber-800">Payment submitted — waiting for admin verification.</p>
      )}

      {payment.status === 'paid' && payment.paidAt && (
        <p className="mt-4 text-sm text-emerald-800">Confirmed on {formatDateTime(payment.paidAt)}.</p>
      )}
    </section>
  )
}
