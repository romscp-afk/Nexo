import { HomeHero } from '@/features/home/components/HomeHero'
import { HomeServicesGrid } from '@/features/home/components/HomeServicesGrid'
import { HomeTrustBar, HomeHowItWorks, HomeCta } from '@/features/home/components/HomeSections'

export function HomePage() {
  return (
    <div className="overflow-x-hidden bg-nexo-50">
      <HomeHero />
      <HomeServicesGrid />
      <HomeTrustBar />
      <HomeHowItWorks />
      <HomeCta />
    </div>
  )
}
