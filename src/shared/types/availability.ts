export type ProviderWeeklyHour = {
  id: string
  providerId: string
  dayOfWeek: number
  isAvailable: boolean
  startTime: string
  endTime: string
}

export type ProviderWeeklyHourRow = {
  id: string
  provider_id: string
  day_of_week: number
  is_available: boolean
  start_time: string
  end_time: string
}

export type WeeklyHourInput = {
  dayOfWeek: number
  isAvailable: boolean
  startTime: string
  endTime: string
}

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
export const DAY_LABELS_FULL = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

export function mapWeeklyHour(row: ProviderWeeklyHourRow): ProviderWeeklyHour {
  return {
    id: row.id,
    providerId: row.provider_id,
    dayOfWeek: row.day_of_week,
    isAvailable: row.is_available,
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
  }
}

export function defaultWeeklyHours(): WeeklyHourInput[] {
  return DAY_LABELS.map((_, dayOfWeek) => ({
    dayOfWeek,
    isAvailable: dayOfWeek !== 0,
    startTime: '09:00',
    endTime: dayOfWeek === 6 ? '13:00' : '18:00',
  }))
}

export function formatTime12h(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const suffix = h >= 12 ? 'pm' : 'am'
  const hour12 = h % 12 || 12
  return `${hour12}:${String(m).padStart(2, '0')}${suffix}`
}

export function formatWeeklyHourSummary(hour: ProviderWeeklyHour): string {
  if (!hour.isAvailable) return 'Closed'
  return `${formatTime12h(hour.startTime)} – ${formatTime12h(hour.endTime)}`
}
