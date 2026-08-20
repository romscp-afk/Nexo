import { Outlet } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { ShieldCheck, Clock, BadgeDollarSign } from 'lucide-react'
import { APP_TAGLINE } from '@/shared/lib/constants'
import { Logo } from '@/shared/components/layout/Logo'

const benefits = [
  { icon: ShieldCheck, text: 'Verified cleaning professionals' },
  { icon: BadgeDollarSign, text: 'Transparent hourly pricing' },
  { icon: Clock, text: 'Flexible scheduling across Singapore' },
]

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Brand panel — desktop */}
      <div className="relative hidden flex-col justify-between bg-hero-gradient p-10 text-white lg:flex lg:w-[44%] xl:w-[42%]">
        <div>
          <Logo to="/" size="lg" className="brightness-0 invert" />
          <p className="mt-8 max-w-sm text-lg leading-relaxed text-brand-pale/90">{APP_TAGLINE}</p>
        </div>
        <ul className="space-y-4">
          {benefits.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm text-brand-pale/85">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                <Icon className="h-4 w-4" />
              </div>
              {text}
            </li>
          ))}
        </ul>
        <p className="text-xs text-brand-pale/60">
          © {new Date().getFullYear()} Nexo · Singapore home cleaning marketplace
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-brand-bg px-4 py-8 lg:px-10">
        <div className="mb-6 w-full max-w-md lg:hidden">
          <Logo to="/" size="lg" className="flex-col gap-2" />
        </div>
        <div className="w-full max-w-md rounded-card-lg border border-brand-border bg-brand-surface p-6 shadow-card sm:p-8">
          <Outlet />
        </div>
        <p className="mt-6 text-center text-sm text-brand-text-muted lg:hidden">
          <Link to="/" className="text-brand-primary hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}
