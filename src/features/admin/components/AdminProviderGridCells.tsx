import type { AdminProviderPaymentSummary } from '@/shared/types/admin'
import { formatSgPhoneDisplay, whatsAppHref } from '@/shared/lib/phone'

export function AdminContactCell({
  value,
  kind,
}: {
  value: string | null
  kind: 'phone' | 'whatsapp'
}) {
  if (!value) {
    return <span className="text-slate-400">—</span>
  }

  const label = formatSgPhoneDisplay(value)

  if (kind === 'whatsapp') {
    return (
      <a
        href={whatsAppHref(value)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-nexo-700 hover:underline"
      >
        {label}
      </a>
    )
  }

  return (
    <a href={`tel:${value}`} className="text-slate-700 hover:underline">
      {label}
    </a>
  )
}

export function AdminProviderPaymentStatus({
  summary,
}: {
  summary: AdminProviderPaymentSummary
}) {
  const total =
    summary.pending +
    summary.submitted +
    summary.paid +
    summary.failed +
    summary.refunded

  if (total === 0) {
    return <span className="text-slate-400">—</span>
  }

  const openCount = summary.pending + summary.submitted

  return (
    <div className="space-y-1">
      {summary.adminFeeDue > 0 && (
        <span className="inline-block rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
          {summary.adminFeeDue} admin fee{summary.adminFeeDue === 1 ? '' : 's'} due
        </span>
      )}
      <div className="text-xs text-slate-600">
        {summary.paid > 0 && <span>{summary.paid} paid</span>}
        {openCount > 0 && (
          <span>
            {summary.paid > 0 ? ' · ' : ''}
            {openCount} open
          </span>
        )}
        {summary.failed > 0 && (
          <span>
            {summary.paid > 0 || openCount > 0 ? ' · ' : ''}
            {summary.failed} failed
          </span>
        )}
      </div>
    </div>
  )
}
