import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Clock, CalendarX } from 'lucide-react'
import {
  useAddTimeOff,
  useDeleteTimeOff,
  useMyTimeOff,
  useMyWeeklyHours,
  useProviderWeeklyHours,
  useUpdateMyWeeklyHours,
} from '@/features/providers/hooks/useProviderAvailability'
import { useProviderBookings } from '@/features/bookings/hooks/useBookings'
import { QueryState } from '@/features/catalog/components/CatalogUi'
import { BookingStatusBadge } from '@/features/bookings/components/BookingUi'
import {
  DAY_LABELS,
  DAY_LABELS_FULL,
  defaultWeeklyHours,
  formatWeeklyHourSummary,
  type WeeklyHourInput,
} from '@/shared/types/availability'
import { formatDateTime } from '@/shared/lib/utils'

function hoursToDraft(
  rows: ReturnType<typeof useMyWeeklyHours>['data'],
): WeeklyHourInput[] {
  if (!rows?.length) return defaultWeeklyHours()
  return DAY_LABELS.map((_, dayOfWeek) => {
    const row = rows.find((r) => r.dayOfWeek === dayOfWeek)
    return row
      ? {
          dayOfWeek,
          isAvailable: row.isAvailable,
          startTime: row.startTime,
          endTime: row.endTime,
        }
      : defaultWeeklyHours()[dayOfWeek]
  })
}

export function ProviderWeeklyHoursEditor() {
  const { data: saved, isLoading, error } = useMyWeeklyHours()
  const update = useUpdateMyWeeklyHours()
  const [draft, setDraft] = useState<WeeklyHourInput[]>(defaultWeeklyHours())
  const [success, setSuccess] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (saved) setDraft(hoursToDraft(saved))
  }, [saved])

  const updateDay = (dayOfWeek: number, patch: Partial<WeeklyHourInput>) => {
    setDraft((prev) =>
      prev.map((row) => (row.dayOfWeek === dayOfWeek ? { ...row, ...patch } : row)),
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess('')
    setFormError('')
    for (const row of draft) {
      if (row.isAvailable && row.startTime >= row.endTime) {
        setFormError(`${DAY_LABELS_FULL[row.dayOfWeek]}: end time must be after start time.`)
        return
      }
    }
    try {
      await update.mutateAsync(draft)
      setSuccess('Working hours saved.')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-start gap-3">
        <Clock className="mt-0.5 h-5 w-5 text-nexo-700" />
        <div>
          <h2 className="font-semibold text-slate-900">Working hours</h2>
          <p className="mt-1 text-sm text-slate-500">
            Customers can only book within these hours (Singapore time). Double bookings are blocked.
          </p>
        </div>
      </div>

      <QueryState loading={isLoading} error={error} empty={false}>
        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          {formError && <p className="text-sm text-red-700">{formError}</p>}
          {success && <p className="text-sm text-green-700">{success}</p>}

          <ul className="divide-y divide-slate-100">
            {draft.map((row) => (
              <li key={row.dayOfWeek} className="flex flex-wrap items-center gap-3 py-3">
                <label className="flex w-28 items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={row.isAvailable}
                    onChange={(e) => updateDay(row.dayOfWeek, { isAvailable: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  {DAY_LABELS[row.dayOfWeek]}
                </label>
                {row.isAvailable ? (
                  <>
                    <input
                      type="time"
                      value={row.startTime}
                      onChange={(e) => updateDay(row.dayOfWeek, { startTime: e.target.value })}
                      className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                    />
                    <span className="text-slate-400">to</span>
                    <input
                      type="time"
                      value={row.endTime}
                      onChange={(e) => updateDay(row.dayOfWeek, { endTime: e.target.value })}
                      className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                    />
                  </>
                ) : (
                  <span className="text-sm text-slate-400">Closed</span>
                )}
              </li>
            ))}
          </ul>

          <button
            type="submit"
            disabled={update.isPending}
            className="rounded-lg bg-nexo-700 px-4 py-2 text-sm font-medium text-white hover:bg-nexo-800 disabled:opacity-50"
          >
            {update.isPending ? 'Saving…' : 'Save working hours'}
          </button>
        </form>
      </QueryState>
    </section>
  )
}

export function ProviderTimeOffEditor() {
  const { data: blocks, isLoading, error } = useMyTimeOff()
  const addBlock = useAddTimeOff()
  const deleteBlock = useDeleteTimeOff()
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [label, setLabel] = useState('')
  const [formError, setFormError] = useState('')

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!startAt || !endAt) {
      setFormError('Start and end are required.')
      return
    }
    if (new Date(endAt) <= new Date(startAt)) {
      setFormError('End must be after start.')
      return
    }
    try {
      await addBlock.mutateAsync({
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        label: label.trim() || undefined,
      })
      setStartAt('')
      setEndAt('')
      setLabel('')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add time off')
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-start gap-3">
        <CalendarX className="mt-0.5 h-5 w-5 text-nexo-700" />
        <div>
          <h2 className="font-semibold text-slate-900">Time off / blocked dates</h2>
          <p className="mt-1 text-sm text-slate-500">
            Block periods when you cannot take jobs. Customers cannot book during these times.
          </p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="mt-5 space-y-3">
        {formError && <p className="text-sm text-red-700">{formError}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-slate-700">From</span>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Until</span>
            <input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
        </div>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Label (optional)</span>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Holiday, medical leave"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={addBlock.isPending}
          className="rounded-lg bg-nexo-700 px-4 py-2 text-sm font-medium text-white hover:bg-nexo-800 disabled:opacity-50"
        >
          {addBlock.isPending ? 'Adding…' : 'Add blocked period'}
        </button>
      </form>

      <div className="mt-6">
        <QueryState
          loading={isLoading}
          error={error}
          empty={!blocks?.length}
          emptyMessage="No upcoming blocked periods."
        >
          <ul className="divide-y divide-slate-100">
            {blocks?.map((block) => (
              <li key={block.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium text-slate-900">
                    {block.label ?? 'Time off'}
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatDateTime(block.startAt)} → {formatDateTime(block.endAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteBlock.mutate(block.id)}
                  disabled={deleteBlock.isPending}
                  className="text-sm text-red-600 hover:underline disabled:opacity-50"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </QueryState>
      </div>
    </section>
  )
}

export function ProviderSchedulePage() {
  const { data: bookings, isLoading, error } = useProviderBookings()

  const upcoming = useMemo(
    () =>
      (bookings ?? [])
        .filter((b) => ['pending', 'confirmed', 'in_progress'].includes(b.status))
        .sort(
          (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
        ),
    [bookings],
  )

  const grouped = useMemo(() => {
    const map = new Map<string, typeof upcoming>()
    for (const booking of upcoming) {
      const key = new Date(booking.scheduledAt).toLocaleDateString('en-SG', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Singapore',
      })
      const list = map.get(key) ?? []
      list.push(booking)
      map.set(key, list)
    }
    return [...map.entries()]
  }, [upcoming])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Schedule</h1>
        <p className="mt-1 text-slate-600">
          Set your availability and view upcoming jobs on your calendar.
        </p>
      </div>

      <ProviderWeeklyHoursEditor />

      <ProviderTimeOffEditor />

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-start gap-3">
            <CalendarDays className="mt-0.5 h-5 w-5 text-nexo-700" />
            <div>
              <h2 className="font-semibold text-slate-900">Upcoming jobs</h2>
              <p className="text-sm text-slate-500">{upcoming.length} scheduled</p>
            </div>
          </div>
          <Link to="/provider/bookings" className="text-sm text-nexo-700 hover:underline">
            All bookings
          </Link>
        </div>

        <QueryState
          loading={isLoading}
          error={error}
          empty={!upcoming.length}
          emptyMessage="No upcoming jobs. New bookings appear here once customers schedule with you."
        >
          <div className="space-y-6">
            {grouped.map(([day, dayBookings]) => (
              <div key={day}>
                <h3 className="text-sm font-semibold text-slate-700">{day}</h3>
                <ul className="mt-2 space-y-2">
                  {dayBookings.map((booking) => (
                    <li key={booking.id}>
                      <Link
                        to={`/provider/bookings/${booking.id}`}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 transition hover:border-nexo-200 hover:bg-nexo-50/50"
                      >
                        <div>
                          <p className="font-medium text-slate-900">
                            {booking.serviceName ?? 'Service'}
                          </p>
                          <p className="text-sm text-slate-500">
                            {formatDateTime(booking.scheduledAt)} · {booking.customerName ?? 'Customer'}
                          </p>
                        </div>
                        <BookingStatusBadge status={booking.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </QueryState>
      </section>
    </div>
  )
}

export function ProviderWeeklyHoursDisplay({ providerId }: { providerId: string }) {
  const { data: hours, isLoading } = useProviderWeeklyHours(providerId)

  if (isLoading || !hours?.length) return null

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="font-semibold text-slate-900">Availability</h2>
      <p className="mt-1 text-sm text-slate-500">Singapore time (SGT)</p>
      <ul className="mt-4 space-y-2 text-sm">
        {hours.map((row) => (
          <li key={row.dayOfWeek} className="flex justify-between gap-4">
            <span className="font-medium text-slate-700">{DAY_LABELS[row.dayOfWeek]}</span>
            <span className={row.isAvailable ? 'text-slate-600' : 'text-slate-400'}>
              {formatWeeklyHourSummary(row)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
