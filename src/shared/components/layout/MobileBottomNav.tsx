import { Link, useLocation } from 'react-router-dom'
import { CalendarDays, LayoutGrid, Menu, MessageCircle, Search } from 'lucide-react'
import { PRIMARY_CATEGORY_SLUG } from '@/shared/lib/catalogConfig'
import { cn } from '@/shared/lib/utils'

type Tab = {
  to?: string
  label: string
  icon: typeof LayoutGrid
  match?: (path: string) => boolean
  action?: 'more'
}

const CUSTOMER_TABS: Tab[] = [
  {
    to: `/services/${PRIMARY_CATEGORY_SLUG}`,
    label: 'Home',
    icon: LayoutGrid,
    match: (p) => p === '/' || p.startsWith('/services'),
  },
  {
    to: `/providers/category/${PRIMARY_CATEGORY_SLUG}`,
    label: 'Book',
    icon: Search,
    match: (p) => p.startsWith('/providers'),
  },
  {
    to: '/dashboard/bookings',
    label: 'Bookings',
    icon: CalendarDays,
    match: (p) => p.startsWith('/dashboard/bookings'),
  },
  {
    to: '/dashboard/messages',
    label: 'Messages',
    icon: MessageCircle,
    match: (p) => p.startsWith('/dashboard/messages'),
  },
  { label: 'More', icon: Menu, action: 'more' },
]

type MobileBottomNavProps = {
  unreadMessages?: number
  moreBadge?: number
  onMoreClick?: () => void
}

export function MobileBottomNav({
  unreadMessages = 0,
  moreBadge = 0,
  onMoreClick,
}: MobileBottomNavProps) {
  const { pathname } = useLocation()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white shadow-[0_-4px_24px_rgba(15,23,42,0.08)] md:hidden"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
        {CUSTOMER_TABS.map(({ to, label, icon: Icon, match, action }) => {
          const active = action === 'more' ? false : match ? match(pathname) : pathname === to
          const messageBadge = label === 'Messages' && unreadMessages > 0
          const moreTabBadge = action === 'more' && moreBadge > 0

          const inner = (
            <>
              <span className="relative flex h-7 w-7 items-center justify-center">
                <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.5 : 2} />
                {(messageBadge || moreTabBadge) && (
                  <span className="absolute -right-1.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-nexo-700 px-1 text-[10px] font-semibold text-white">
                    {messageBadge
                      ? unreadMessages > 9
                        ? '9+'
                        : unreadMessages
                      : moreBadge > 9
                        ? '9+'
                        : moreBadge}
                  </span>
                )}
              </span>
              <span className="max-w-full truncate text-[11px] font-semibold leading-none">{label}</span>
              {active && (
                <span className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-nexo-700" aria-hidden />
              )}
            </>
          )

          const className = cn(
            'relative flex min-h-[56px] min-w-0 flex-1 flex-col items-center justify-center gap-1 px-0.5 py-1.5 transition-colors',
            active ? 'text-nexo-700' : 'text-slate-500 active:text-nexo-600',
          )

          if (action === 'more') {
            return (
              <button
                key={label}
                type="button"
                onClick={onMoreClick}
                className={className}
                aria-label="Open more menu"
              >
                {inner}
              </button>
            )
          }

          return (
            <Link key={to} to={to!} className={className}>
              {inner}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
