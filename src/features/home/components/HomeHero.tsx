import { ShieldCheck, Users, BadgeCheck } from 'lucide-react'
import { HomeHeroEstimateCard } from '@/features/home/components/HomeHeroEstimateCard'
import mainBannerUrl from '@/assets/main-banner.jpg'
import { isNativeApp } from '@/shared/lib/nativeApp'
import { cn } from '@/shared/lib/utils'

const trustItems = [
  { icon: Users, label: 'Provider Profiles Reviewed' },
  { icon: ShieldCheck, label: 'Clear Pricing' },
  { icon: BadgeCheck, label: 'Trackable Bookings' },
]

export function HomeHero() {
  const native = isNativeApp()

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-light via-white to-brand-pale">
      <img
        src={mainBannerUrl}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[70%_center] opacity-[0.18] lg:object-[85%_center]"
        fetchPriority="high"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/40 lg:via-white/90 lg:to-transparent"
      />

      <div
        className={cn(
          'relative mx-auto max-w-6xl px-4',
          native ? 'pb-6 pt-8' : 'py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20',
        )}
      >
        <div
          className={cn(
            'grid items-center gap-8',
            !native && 'gap-10 sm:px-0 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_420px]',
          )}
        >
          <div className="max-w-xl">
            <h1
              className={cn(
                'font-bold tracking-tight text-brand-navy',
                native ? 'text-3xl leading-tight sm:text-4xl' : 'text-display',
              )}
            >
              A cleaner home,
              <br />
              more time for you.
            </h1>

            <p className="mt-4 text-base leading-relaxed text-brand-text-secondary sm:mt-5 sm:text-lg">
              Trusted home-cleaning services in Singapore. Book in minutes. Relax always.
            </p>

            <ul className="mt-8 grid grid-cols-3 gap-3 sm:mt-10 sm:gap-6 lg:max-w-md lg:gap-8">
              {trustItems.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex flex-col items-center gap-2.5 text-center sm:gap-3"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-brand-primary/25 bg-brand-light text-brand-primary shadow-sm sm:h-16 sm:w-16 lg:h-[4.5rem] lg:w-[4.5rem]">
                    <Icon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8" strokeWidth={2} />
                  </span>
                  <span className="max-w-[6.5rem] text-[0.8125rem] font-semibold leading-snug text-brand-navy sm:max-w-[8rem] sm:text-sm lg:max-w-[9rem] lg:text-[0.9375rem]">
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
