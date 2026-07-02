import { HomeHero } from '@/features/home/components/HomeHero'
import { HomeServicesGrid } from '@/features/home/components/HomeServicesGrid'
import { HomeTrustBar, HomeHowItWorks, HomeCta } from '@/features/home/components/HomeSections'
import { HomeReviews } from '@/features/home/components/HomeReviews'

export function HomePage() {
  return (
    <div className="overflow-x-hidden bg-nexo-pearl">
      <HomeHero />
      <HomeServicesGrid />
      <HomeReviews />
      <HomeTrustBar />
      <HomeHowItWorks />
      <HomeCta />
    </div>
  )
}
