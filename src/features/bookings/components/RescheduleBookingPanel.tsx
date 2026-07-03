import { useState } from 'react'
import { CalendarClock } from 'lucide-react'
import { useRescheduleBooking } from '@/features/bookings/hooks/useBookings'
import { providerAvailabilityService } from '@/shared/services/providerAvailabilityService'
import { formatDateTime } from '@/shared/lib/utils'
import type { Booking } from '@/shared/types/booking'

export function RescheduleBookingPanel({ booking }: { booking: Booking }) {
  const reschedule = useRescheduleBooking()
  const [open, setOpen] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (!['pending', 'confirmed'].includes(booking.status)) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!scheduledAt) {
      setError('Choose a new date and time.')
      return
    }
    if (booking.providerId) {
      const slotCheck = await providerAvailabilityService.checkSlot(
        booking.providerId,
        new Date(scheduledAt).toISOString(),
        booking.durationHours,
        booking.id,
      )
      if (slotCheck.error || !slotCheck.data?.ok) {
        setError(slotCheck.data?.reason ?? slotCheck.error ?? 'Time slot not available.')
        return
      }
    }
    try {
      await reschedule.mutateAsync({
        id: booking.id,
        scheduledAt: new Date(scheduledAt).toISOString(),
      })
      setSuccess(`Rescheduled to ${formatDateTime(new Date(scheduledAt).toISOString())}`)
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reschedule failed')
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-slate-900">
            <CalendarClock className="h-5 w-5 text-nexo-700" />
            Reschedule
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Current: {formatDateTime(booking.scheduledAt)}
          </p>
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Change date & time
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {error && <p className="text-sm text-red-700">{error}</p>}
          {success && <p className="text-sm text-green-700">{success}</p>}
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            required
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={reschedule.isPending}
              className="rounded-lg bg-nexo-700 px-4 py-2 text-sm font-medium text-white hover:bg-nexo-800 disabled:opacity-50"
            >
              {reschedule.isPending ? 'Saving…' : 'Save new time'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
