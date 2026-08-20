import { HomeHero } from '@/features/home/components/HomeHero'
import { HomeTrustBar } from '@/features/home/components/HomeSections'
import { HomeServicesGrid } from '@/features/home/components/HomeServicesGrid'
import { HomeHowItWorks, HomeCta } from '@/features/home/components/HomeSections'
import { HomeFeaturedProviders } from '@/features/home/components/HomeFeaturedProviders'
import { HomePricing } from '@/features/home/components/HomePricing'
import { HomeReviews } from '@/features/home/components/HomeReviews'

export function HomePage() {
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
