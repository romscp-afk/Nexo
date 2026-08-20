import { Link } from 'react-router-dom'
import { ArrowRight, ShieldCheck, Clock, BadgeDollarSign, HeadphonesIcon } from 'lucide-react'
import { CleaningRequestLink } from '@/shared/components/CleaningPriceLabel'
import { HomeHeroEstimateCard } from '@/features/home/components/HomeHeroEstimateCard'
import { trackEvent } from '@/shared/lib/analytics'
import { PRIMARY_CATEGORY_SLUG } from '@/shared/lib/catalogConfig'
import mainBannerUrl from '@/assets/main-banner.jpg'

const trustItems = [
  { icon: ShieldCheck, label: 'Trusted professionals' },
  { icon: BadgeDollarSign, label: 'Clear pricing' },
  { icon: Clock, label: 'Flexible scheduling' },
  { icon: HeadphonesIcon, label: 'Singapore-wide service' },
]

export function HomeHero() {
  return (
    <section className="relative min-h-[520px] overflow-hidden text-white sm:min-h-[560px] lg:min-h-[620px]">
      <img
        src={mainBannerUrl}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover object-[center_40%]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-brand-navy/95 via-brand-navy/82 to-brand-navy/35 lg:to-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-brand-navy/60 via-transparent to-brand-navy/30"
      />

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="relative z-10 max-w-xl">
            <p className="hero-enter inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-brand-pale backdrop-blur-sm">
              Home cleaning services in Singapore
            </p>

            <h1 className="hero-enter mt-6 text-display font-bold text-white drop-shadow-sm">
              Reliable home cleaning, booked around your schedule.
            </h1>

            <p className="hero-enter mt-5 text-lg leading-relaxed text-brand-pale/95">
              Request trusted home-cleaning services with transparent pricing and a simple booking
              experience.
            </p>

            <div className="hero-enter mt-8 flex flex-wrap gap-3">
              <CleaningRequestLink
                onClick={() => trackEvent('request_cleaning_clicked', { source: 'hero' })}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-navy shadow-brand transition hover:bg-brand-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Request a Cleaning
                <ArrowRight className="h-4 w-4" />
              </CleaningRequestLink>
              <Link
                to={`/providers/category/${PRIMARY_CATEGORY_SLUG}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Find a Cleaner
              </Link>
            </div>

            <ul className="hero-enter mt-10 grid grid-cols-2 gap-3">
              {trustItems.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2 text-sm text-brand-pale/90">
                  <Icon className="h-4 w-4 shrink-0 text-brand-electric" strokeWidth={2} />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative z-10 lg:pt-4">
            <HomeHeroEstimateCard />
          </div>
        </div>
      </div>
    </section>
  )
}
