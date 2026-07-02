import { HomeHero, HomeAssistantPromo } from '@/features/home/components/HomeHero'
import { HomeServicesGrid } from '@/features/home/components/HomeServicesGrid'
import { HomeTrustBar, HomeHowItWorks, HomeCta } from '@/features/home/components/HomeSections'

export function HomePage() {
  return (
    <div className="overflow-x-hidden bg-white">
      <HomeHero />
      <HomeTrustBar />
      <HomeServicesGrid />
      <HomeHowItWorks />
      <HomeAssistantPromo />
      <HomeCta />
    </div>
  )
}
