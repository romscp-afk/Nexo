import { Navigate } from 'react-router-dom'
import { HomeHero } from '@/features/home/components/HomeHero'
import { HomeTrustBar } from '@/features/home/components/HomeSections'
import { HomeServicesGrid } from '@/features/home/components/HomeServicesGrid'
import { HomeHowItWorks, HomeCta } from '@/features/home/components/HomeSections'
import { HomeFeaturedProviders } from '@/features/home/components/HomeFeaturedProviders'
import { HomePricing } from '@/features/home/components/HomePricing'
import { HomeReviews } from '@/features/home/components/HomeReviews'
import { useAuth } from '@/features/auth/context/AuthProvider'
import { getDashboardPath } from '@/shared/lib/constants'
import { isNativeApp } from '@/shared/lib/nativeApp'
import { PAGE_META, usePageMeta } from '@/shared/lib/pageMeta'

export function HomePage() {
  usePageMeta(PAGE_META.home)
  const { user, loading } = useAuth()
  const native = isNativeApp()

  // Native app: signed-in users land in their portal, not the marketing site.
  if (native && !loading && user) {
    return <Navigate to={getDashboardPath(user.role)} replace />
  }

  if (native) {
    return (
      <div className="overflow-x-hidden bg-brand-bg">
        <HomeHero />
        <HomePricing />
        <HomeCta />
      </div>
    )
  }

  return (
    <div className="overflow-x-hidden bg-brand-bg">
      <HomeHero />
      <HomeTrustBar />
      <HomeServicesGrid />
      <HomeHowItWorks />
      <HomeFeaturedProviders />
      <HomePricing />
      <HomeReviews />
      <HomeCta />
    </div>
  )
}
