import { useState } from 'react'
import { useAdminPayments, useConfirmPayment } from '@/features/payments/hooks/usePayments'
import { QueryState } from '@/features/catalog/components/CatalogUi'
import { formatCurrency, formatDateTime } from '@/shared/lib/utils'
import { PAYMENT_KIND_LABELS, PAYMENT_STATUS_LABELS } from '@/shared/types/payment'

export function AdminPaymentsPage() {
  const { data: payments, isLoading, error } = useAdminPayments()
  const confirmPayment = useConfirmPayment()
  const [actionError, setActionError] = useState('')

  const handleConfirm = async (paymentId: string) => {
    setActionError('')
    try {
      await confirmPayment.mutateAsync(paymentId)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Confirm failed')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">PayNow payments</h1>
      <p className="mt-1 text-slate-600">
        Track advance payments to +6587877525. Confirm after verifying the bank transfer.
      </p>

      {actionError && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</p>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <QueryState loading={isLoading} error={error} empty={!payments?.length}>
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {payments?.map((payment) => (
                <tr
                  key={payment.id}
                  className={`border-b border-slate-100 last:border-0 ${
                    payment.bookingPaymentMethod === 'cash' ? 'bg-amber-50/80' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-xs">{payment.reference}</td>
                  <td className="px-4 py-3 text-xs">{PAYMENT_KIND_LABELS[payment.paymentKind]}</td>
                  <td className="px-4 py-3">
                    {payment.bookingPaymentMethod === 'cash' ? (
                      <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-950">CASH</span>
                    ) : (
                      'PayNow'
                    )}
                  </td>
                  <td className="px-4 py-3">{payment.customerEmail ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div>{payment.serviceName ?? '—'}</div>
                    <div className="text-xs text-slate-500">{payment.providerName}</div>
                  </td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(payment.amount)}</td>
                  <td className="px-4 py-3">{PAYMENT_STATUS_LABELS[payment.status]}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDateTime(payment.createdAt)}</td>
                  <td className="px-4 py-3">
                    {['pending', 'submitted'].includes(payment.status) ? (
                      <button
                        type="button"
                        onClick={() => void handleConfirm(payment.id)}
                        disabled={confirmPayment.isPending}
                        className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-50"
                      >
                        Confirm received
                      </button>
                    ) : payment.paidAt ? (
                      <span className="text-xs text-emerald-700">Paid {formatDateTime(payment.paidAt)}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </QueryState>
      </div>
    </div>
  )
}
