import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useCleaningPricing } from '@/shared/hooks/useCleaningPricing'

/** Shared cleaning price display — single source from DB + provider rates. */
export function CleaningPriceLabel({
  className,
  showDetail = false,
}: {
  className?: string
  showDetail?: boolean
}) {
  const pricing = useCleaningPricing()

  if (pricing.loading) {
    return <span className={className}>Loading rates…</span>
  }

  return (
    <span className={className}>
      {pricing.variesByCleaner ? 'Rates vary by service provider' : pricing.headline}
      {showDetail && (
        <span className="mt-0.5 block text-xs font-normal opacity-80">
          {pricing.detail}
        </span>
      )}
    </span>
  )
}

export function CleaningPriceInline({ className }: { className?: string }) {
  const pricing = useCleaningPricing()
  if (pricing.loading) return null
  return (
    <p className={className}>
      {pricing.variesByCleaner ? (
        <>
          <span className="font-medium">Rates vary by service provider</span>
          <span className="block text-xs opacity-80">
            Hourly · {pricing.minDurationHours} hr minimum
          </span>
        </>
      ) : (
        <>
          <span className="font-medium">{pricing.headline}</span>
          <span className="block text-xs opacity-80">
            Per hour · {pricing.minDurationHours} hr minimum
          </span>
        </>
      )}
    </p>
  )
}

export function CleaningRequestLink({
  children,
  className,
  onClick,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <Link to="/services/cleaning/request" className={className} onClick={onClick}>
      {children}
    </Link>
  )
}
