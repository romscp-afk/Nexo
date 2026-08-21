import { Link } from 'react-router-dom'
import { CalendarCheck, ClipboardList, LogIn, Sparkles, UserPlus } from 'lucide-react'
import { Logo } from '@/shared/components/layout/Logo'

/** Capacitor-only home — app launch screen, not the marketing website. */
export function NativeAppHome() {
  return (
    <div className="flex min-h-full flex-col px-5 pb-4 pt-2">
      <div className="pt-4 text-center">
        <Logo to="/" size="lg" className="mx-auto justify-center" />
        <p className="mt-3 text-sm text-brand-text-secondary">Home cleaning in Singapore</p>
      </div>

      <div className="mt-8 space-y-3">
        <Link
          to="/services/cleaning/request"
          className="flex items-center gap-4 rounded-2xl bg-brand-primary px-5 py-5 text-white shadow-brand active:bg-brand-primary-hover"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
            <Sparkles className="h-6 w-6" />
          </span>
          <span className="flex-1 text-left">
            <span className="block text-lg font-bold">Book a cleaning</span>
            <span className="mt-0.5 block text-sm text-white/85">Request a service in a few taps</span>
          </span>
        </Link>

        <Link
          to="/login"
          className="flex items-center gap-4 rounded-2xl border border-brand-border bg-white px-5 py-4 active:bg-brand-light"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-light text-brand-primary">
            <LogIn className="h-5 w-5" />
          </span>
          <span className="flex-1 text-left">
            <span className="block font-semibold text-brand-text">Log in</span>
            <span className="mt-0.5 block text-sm text-brand-text-secondary">
              Customer or service provider portal
            </span>
          </span>
        </Link>

        <Link
          to="/register"
          className="flex items-center gap-4 rounded-2xl border border-brand-border bg-white px-5 py-4 active:bg-brand-light"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-light text-brand-primary">
            <UserPlus className="h-5 w-5" />
          </span>
          <span className="flex-1 text-left">
            <span className="block font-semibold text-brand-text">Create account</span>
            <span className="mt-0.5 block text-sm text-brand-text-secondary">Join as customer or provider</span>
          </span>
        </Link>
      </div>

      <div className="mt-10 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-text-muted">How it works</p>
        <ul className="space-y-3">
          {[
            { icon: ClipboardList, title: 'Tell us what you need', body: 'Type, schedule and location' },
            { icon: CalendarCheck, title: 'Submit your request', body: 'Sign in when you are ready' },
            { icon: Sparkles, title: 'Get connected', body: 'A provider accepts and cleans' },
          ].map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex items-start gap-3 rounded-xl bg-white px-4 py-3.5 border border-brand-border">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-white">
                <Icon className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-brand-text">{title}</span>
                <span className="mt-0.5 block text-sm text-brand-text-secondary">{body}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
