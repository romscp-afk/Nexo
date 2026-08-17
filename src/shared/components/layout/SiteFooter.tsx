import { Link } from 'react-router-dom'
import { APP_NAME, APP_TAGLINE, DEVELOPER_NAME, DEVELOPER_URL } from '@/shared/lib/constants'
import { PRIMARY_CATEGORY_SLUG } from '@/shared/lib/catalogConfig'
import { cn } from '@/shared/lib/utils'

type SiteFooterProps = {
  className?: string
  compact?: boolean
}

const footerLinks = [
  { label: 'How Nexo Works', to: '/how-it-works' },
  { label: 'Cleaning Services', to: `/services/${PRIMARY_CATEGORY_SLUG}` },
  { label: 'Become a Provider', to: '/register?role=provider' },
  { label: 'Contact / Support', to: '/contact' },
  { label: 'Terms of Service', to: '/terms' },
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Cancellation Policy', to: '/cancellation-policy' },
]

export function SiteFooter({ className, compact = false }: SiteFooterProps) {
  return (
    <footer
      className={cn(
        'text-center text-xs text-nexo-700/60',
        compact ? 'py-3' : 'border-t border-nexo-200/80 py-6',
        className,
      )}
    >
      {!compact && (
        <nav
          aria-label="Footer"
          className="mx-auto mb-4 flex max-w-4xl flex-wrap justify-center gap-x-4 gap-y-2 px-4"
        >
          {footerLinks.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              className="min-h-9 inline-flex items-center text-nexo-700/80 underline-offset-2 transition hover:text-nexo-800 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nexo-600"
            >
              {label}
            </Link>
          ))}
        </nav>
      )}
      <p>
        © {new Date().getFullYear()} {APP_NAME}. All rights reserved.{' '}
        <a
          href={DEVELOPER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-nexo-600/70 underline-offset-2 transition hover:text-nexo-700 hover:underline"
        >
          By {DEVELOPER_NAME}
        </a>
      </p>
      {!compact && (
        <p className="mt-1 text-nexo-600/50">{APP_TAGLINE}</p>
      )}
    </footer>
  )
}
