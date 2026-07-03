import { formatCurrency } from '@/shared/lib/utils'
import type { PriceBreakdown as PriceBreakdownType } from '@/shared/lib/pricing'

type Props = {
  breakdown: PriceBreakdownType | null
  paymentMethod?: 'paynow' | 'cash'
  compact?: boolean
}

export function PriceBreakdownPanel({ breakdown, paymentMethod, compact }: Props) {
  if (!breakdown) {
    return (
      <p className="text-sm text-slate-500">Select a service to see pricing.</p>
    )
  }

  return (
    <div className={compact ? 'space-y-2 text-sm' : 'space-y-3'}>
      <dl className="space-y-2">
        {breakdown.lines.map((line) => (
          <div key={line.label} className="flex justify-between gap-4">
            <dt className="text-slate-600">{line.label}</dt>
            <dd className="font-medium text-slate-900">{formatCurrency(line.amount)}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-4">
          <dt className="text-slate-600">Platform fee</dt>
          <dd className="font-medium text-slate-900">{formatCurrency(breakdown.platformFee)}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-slate-200 pt-2">
          <dt className="font-semibold text-slate-900">Total</dt>
          <dd className="text-lg font-bold text-nexo-700">{formatCurrency(breakdown.total)}</dd>
        </div>
      </dl>
      {paymentMethod === 'cash' && (
        <p className="text-xs text-slate-500">
          Service amount paid in cash to the provider. Platform fee of{' '}
          {formatCurrency(breakdown.platformFee)} applies on cash jobs.
        </p>
      )}
      {paymentMethod === 'paynow' && (
        <p className="text-xs text-slate-500">
          Pay via PayNow after the provider confirms. Total includes platform fee.
        </p>
      )}
    </div>
  )
}
