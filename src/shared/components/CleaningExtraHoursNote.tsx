import { CLEANING_EXTRA_HOUR_RATE_SGD } from '@/shared/lib/cleaningContent'
import { formatCurrency } from '@/shared/lib/utils'

type Props = {
  className?: string
}

export function CleaningExtraHoursNote({ className }: Props) {
  return (
    <p className={className ?? 'text-xs text-slate-500'}>
      Extra hours beyond your booked duration are charged at{' '}
      {formatCurrency(CLEANING_EXTRA_HOUR_RATE_SGD)}/hr (if agreed with the service provider on site).
    </p>
  )
}
