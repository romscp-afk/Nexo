import { FileText } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { receiptService } from '@/shared/services/receiptService'
import { formatCurrency, formatDateTime } from '@/shared/lib/utils'
import { QueryState } from '@/features/catalog/components/CatalogUi'

export function ReceiptPanel({ bookingId }: { bookingId: string }) {
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
        <FileText className="h-5 w-5 text-teal-700" />
        Receipts
      </h2>
      <QueryState
        loading={isLoading}
        error={error}
        empty={!receipts?.length}
        emptyMessage="No receipts yet. Receipts appear when a job is completed or admin confirms payment."
      >
        <ul className="mt-4 space-y-3">
          {receipts?.map((receipt) => (
            <li key={receipt.id} className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-mono font-medium text-slate-900">{receipt.receiptNumber}</p>
                  <p className="mt-1 text-slate-600">
                    {String(receipt.details.service_name ?? 'Service')} ·{' '}
                    {receipt.paymentMethod === 'cash' ? 'Cash job' : 'PayNow'}
                  </p>
                </div>
                <p className="text-lg font-bold text-teal-800">{formatCurrency(receipt.amount)}</p>
              </div>
              <p className="mt-2 text-xs text-slate-500">{formatDateTime(receipt.createdAt)}</p>
              {receipt.details.provider_name != null && (
                <p className="mt-1 text-slate-600">Provider: {String(receipt.details.provider_name)}</p>
              )}
            </li>
          ))}
        </ul>
      </QueryState>
    </section>
  )
}
