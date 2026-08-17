import { MIN_BOOKING_HOURS } from '@/shared/lib/cleaningContent'

/** Bookable cleaning durations (hours). */
export const CLEANING_BOOKING_DURATIONS = [2, 3, 4] as const

export type CleaningBookingDuration = (typeof CLEANING_BOOKING_DURATIONS)[number]

export const CLEANING_DAY_START_HOUR = 7
export const CLEANING_DAY_END_HOUR = 19

export function isCleaningBookingDuration(value: number): value is CleaningBookingDuration {
  return (CLEANING_BOOKING_DURATIONS as readonly number[]).includes(value)
}

export function getCleaningStartHours(durationHours: number): number[] {
  const duration = Math.max(MIN_BOOKING_HOURS, durationHours)
  const hours: number[] = []
  for (let hour = CLEANING_DAY_START_HOUR; hour + duration <= CLEANING_DAY_END_HOUR; hour += 1) {
    hours.push(hour)
  }
  return hours
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function formatCleaningHourLabel(hour: number): string {
  const normalized = hour % 24
  const period = normalized >= 12 ? 'PM' : 'AM'
  const h12 = normalized % 12 || 12
  return `${h12}:00 ${period}`
}

export function formatCleaningTimeRange(startHour: number, durationHours: number): string {
  const endHour = startHour + durationHours
  return `${formatCleaningHourLabel(startHour)} – ${formatCleaningHourLabel(endHour)}`
}

export function buildCleaningScheduledAt(date: string, startHour: number): string {
  return `${date}T${pad2(startHour)}:00`
}

export function parseCleaningScheduledAt(
  value: string,
): { date: string; startHour: number | null } {
  if (!value) return { date: '', startHour: null }

  const localMatch = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):/)
  if (localMatch) {
    return { date: localMatch[1], startHour: Number(localMatch[2]) }
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return { date: '', startHour: null }

  return {
    date: `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`,
    startHour: parsed.getHours(),
  }
}

export function minCleaningScheduleDate(): string {
  const now = new Date()
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`
}

export function formatCleaningScheduleSummary(
  scheduledAt: string,
  durationHours: number,
): string {
  const { date, startHour } = parseCleaningScheduledAt(scheduledAt)
  if (!date || startHour == null) return '—'

  const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString('en-SG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return `${dateLabel} · ${formatCleaningTimeRange(startHour, durationHours)} (${durationHours} hr${
    durationHours === 1 ? '' : 's'
  })`
}
