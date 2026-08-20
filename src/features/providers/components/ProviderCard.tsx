import { Link } from 'react-router-dom'
import { ArrowRight, Star, BadgeCheck, MapPin } from 'lucide-react'
import type { ProviderListing } from '@/shared/types/catalog'
import { ProviderAvatar } from '@/features/providers/components/ProviderAvatar'
import { useCleaningPricing } from '@/shared/hooks/useCleaningPricing'
import { formatCurrency } from '@/shared/lib/utils'
import { Badge } from '@/shared/components/ui/Badge'

export function ProviderCard({ provider }: { provider: ProviderListing }) {
  const { catalogBasePrice, loading: pricingLoading } = useCleaningPricing()
  const displayRate = pricingLoading ? null : catalogBasePrice

  return (
    <Link
      to={`/providers/${provider.id}`}
      className="group block rounded-card-lg border border-brand-border bg-brand-surface p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-brand-primary/25 hover:shadow-card-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className="flex items-start gap-4">
        <ProviderAvatar name={provider.businessName} avatarUrl={provider.avatarUrl} size="md" />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-brand-text group-hover:text-brand-primary">
                  {provider.businessName}
                </h3>
                {provider.isVerified && (
                  <BadgeCheck className="h-4 w-4 shrink-0 text-brand-primary" aria-label="Verified" />
                )}
              </div>
              {provider.bio && (
                <p className="mt-1 line-clamp-2 text-sm text-brand-text-secondary">{provider.bio}</p>
              )}
            </div>
            <div className="shrink-0 text-right text-sm">
              {provider.ratingCount > 0 && (
                <div className="flex items-center justify-end gap-1 text-brand-warning">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="font-medium text-brand-text">{provider.ratingAvg.toFixed(1)}</span>
                  <span className="text-brand-text-muted">({provider.ratingCount})</span>
                </div>
              )}
              <p className="mt-1 text-brand-text-secondary">
                from {displayRate != null ? formatCurrency(displayRate) : '…'}/hr
              </p>
            </div>
          </div>

          {provider.serviceAreas.length > 0 && (
            <div className="mt-3 flex items-center gap-1 text-xs text-brand-text-muted">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>
                {provider.serviceAreas.slice(0, 3).join(', ')}
                {provider.serviceAreas.length > 3 && ` +${provider.serviceAreas.length - 3}`}
              </span>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {provider.services.length > 0 ? (
                provider.services.slice(0, 2).map((service) => (
                  <Badge key={service.serviceId} variant="muted">
                    {service.name}
                  </Badge>
                ))
              ) : (
                <Badge variant="default">Home cleaning</Badge>
              )}
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary">
              View Profile
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
