import { Download, FileText } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { receiptService } from '@/shared/services/receiptService'
import { formatCurrency, formatDateTime } from '@/shared/lib/utils'
import { downloadReceiptPdf, receiptSummaryLines } from '@/shared/lib/receiptPdf'
import { QueryState } from '@/features/catalog/components/CatalogUi'
import type { Booking } from '@/shared/types/booking'

export function ReceiptPanel({ bookingId, booking }: { bookingId: string; booking?: Booking | null }) {
  const { data: receipts, isLoading, error } = useQuery({
    queryKey: ['receipts', bookingId],
    queryFn: async () => {
      const { data, error: err } = await receiptService.listForBooking(bookingId)
      if (err) throw new Error(err)
      return data
    },
    enabled: Boolean(bookingId),
  })

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="flex items-center gap-2 font-semibold text-slate-900">
        <FileText className="h-5 w-5 text-nexo-700" />
        Receipts
      </h2>
      <QueryState
        loading={isLoading}
        error={error}
        empty={!receipts?.length}
        emptyMessage="No receipts yet. Receipts appear when a job is completed or admin confirms payment."
      >
        <ul className="mt-4 space-y-4">
          {receipts?.map((receipt) => {
            const summary = receiptSummaryLines(receipt, booking)
            return (
              <li key={receipt.id} className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-semibold text-nexo-800">{receipt.receiptNumber}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDateTime(receipt.createdAt)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadReceiptPdf(receipt, booking)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-nexo-200 bg-white px-3 py-1.5 text-xs font-medium text-nexo-700 hover:bg-nexo-50"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download PDF
                  </button>
                </div>

                <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Service</dt>
                    <dd className="font-medium text-slate-900">{summary.serviceName}</dd>
                  </div>
                  {summary.providerName && (
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-slate-500">Provider</dt>
                      <dd className="text-slate-800">{summary.providerName}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Payment</dt>
                    <dd className="text-slate-800">
                      {receipt.paymentMethod === 'cash' ? 'Cash on completion' : 'PayNow'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Job size</dt>
                    <dd className="text-slate-800">
                      {summary.quantity != null
                        ? `${summary.quantity} unit${summary.quantity === 1 ? '' : 's'}`
                        : summary.durationHours != null
                          ? `${summary.durationHours} hour${summary.durationHours === 1 ? '' : 's'}`
                          : '—'}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 space-y-1 border-t border-slate-200 pt-3 text-sm">
                  {summary.subtotal != null && (
                    <div className="flex justify-between text-slate-600">
                      <span>Service subtotal</span>
                      <span>{formatCurrency(summary.subtotal)}</span>
                    </div>
                  )}
                  {summary.platformFee != null && (
                    <div className="flex justify-between text-slate-600">
                      <span>Platform fee</span>
                      <span>{formatCurrency(summary.platformFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 text-base font-bold text-nexo-800">
                    <span>Amount paid</span>
                    <span>{formatCurrency(receipt.amount)}</span>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </QueryState>
    </section>
  )
}
