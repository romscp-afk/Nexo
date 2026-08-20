import { Link } from 'react-router-dom'
import { APP_NAME, APP_TAGLINE, DEVELOPER_NAME, DEVELOPER_URL } from '@/shared/lib/constants'
import { PRIMARY_CATEGORY_SLUG } from '@/shared/lib/catalogConfig'
import { Logo } from '@/shared/components/layout/Logo'
import { cn } from '@/shared/lib/utils'

type SiteFooterProps = {
  className?: string
  compact?: boolean
}

const footerSections = [
  {
    title: 'Services',
    links: [
      { label: 'Home Cleaning', to: `/services/${PRIMARY_CATEGORY_SLUG}` },
      { label: 'Request Cleaning', to: '/services/cleaning/request' },
      { label: 'Find a Cleaner', to: `/providers/category/${PRIMARY_CATEGORY_SLUG}` },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'How It Works', to: '/how-it-works' },
      { label: 'Support', to: '/support' },
      { label: 'Join as a Service Provider', to: '/register?role=provider' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Terms & Conditions', to: '/terms' },
      { label: 'Cancellation Policy', to: '/cancellation-policy' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Customer Login', to: '/login' },
      { label: 'Register', to: '/register' },
    ],
  },
]

export function SiteFooter({ className, compact = false }: SiteFooterProps) {
  if (compact) {
    return (
      <footer className={cn('py-3 text-center text-xs text-brand-text-muted', className)}>
        <p>
          © {new Date().getFullYear()} {APP_NAME} ·{' '}
          <a href={DEVELOPER_URL} target="_blank" rel="noopener noreferrer" className="hover:underline">
            {DEVELOPER_NAME}
          </a>
        </p>
      </footer>
    )
  }

  return (
    <footer className={cn('border-t border-brand-border bg-brand-navy text-brand-pale/80', className)}>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo to="/" size="md" className="brightness-0 invert" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-brand-pale/70">
              {APP_TAGLINE}
            </p>
          </div>
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-white">{section.title}</h3>
              <ul className="mt-4 space-y-2">
                {section.links.map(({ label, to }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="text-sm text-brand-pale/70 transition hover:text-white"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-brand-pale/50 sm:flex-row">
          <p>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
          <a href={DEVELOPER_URL} target="_blank" rel="noopener noreferrer" className="hover:text-brand-pale/80">
            Developed by {DEVELOPER_NAME}
          </a>
        </div>
      </div>
    </footer>
  )
}
