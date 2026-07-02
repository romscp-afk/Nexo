import { BOOKING_STATUS_LABELS, type BookingStatusHistoryEntry } from '@/shared/types/booking'
import { BookingStatusBadge } from '@/features/bookings/components/BookingUi'
import { formatDateTime } from '@/shared/lib/utils'

export function BookingStatusTimeline({
  history,
}: {
  history: BookingStatusHistoryEntry[]
}) {
  if (history.length === 0) {
    return <p className="text-sm text-slate-500">No status updates recorded yet.</p>
  }

  return (
    <ol className="relative space-y-4 border-l border-slate-200 pl-5">
      {history.map((entry) => (
        <li key={entry.id} className="relative">
          <span className="absolute -left-[1.35rem] top-1.5 h-2.5 w-2.5 rounded-full bg-nexo-600 ring-4 ring-white" />
          <div className="flex flex-wrap items-center gap-2">
            {entry.oldStatus ? (
              <>
                <BookingStatusBadge status={entry.oldStatus} />
                <span className="text-slate-400">→</span>
                <BookingStatusBadge status={entry.newStatus} />
              </>
            ) : (
              <BookingStatusBadge status={entry.newStatus} />
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {BOOKING_STATUS_LABELS[entry.newStatus]} · {formatDateTime(entry.createdAt)}
          </p>
        </li>
      ))}
    </ol>
  )
}
