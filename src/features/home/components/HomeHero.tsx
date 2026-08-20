import { ShieldCheck, Users, BadgeCheck } from 'lucide-react'
import { HomeHeroEstimateCard } from '@/features/home/components/HomeHeroEstimateCard'
import mainBannerUrl from '@/assets/main-banner.jpg'

const trustItems = [
  { icon: Users, label: 'Trusted Cleaners' },
  { icon: ShieldCheck, label: 'Vetted & Insured' },
  { icon: BadgeCheck, label: 'Satisfaction Guaranteed' },
]

export function HomeHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-light via-white to-brand-pale">
      {/* Soft banner texture on the right */}
      <img
        src={mainBannerUrl}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[70%_center] opacity-[0.18] lg:object-[85%_center]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/40 lg:via-white/90 lg:to-transparent"
      />

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_420px]">
          <div className="max-w-xl">
            <h1 className="text-display font-bold tracking-tight text-brand-navy">
              A cleaner home,
              <br />
              more time for you.
            </h1>

            <p className="mt-5 text-lg leading-relaxed text-brand-text-secondary">
              Trusted home-cleaning services in Singapore. Book in minutes. Relax always.
            </p>

            <ul className="mt-10 flex flex-wrap gap-6 sm:gap-8">
              {trustItems.map(({ icon: Icon, label }) => (
                <li key={label} className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-brand-primary/20 bg-brand-light text-brand-primary">
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <span className="max-w-[7rem] text-xs font-medium leading-snug text-brand-text-secondary">
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="w-full lg:justify-self-end">
            <HomeHeroEstimateCard />
          </div>
        </div>
      </div>
    </section>
  )
}
