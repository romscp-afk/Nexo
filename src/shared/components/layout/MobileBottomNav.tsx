import { Link, useLocation } from 'react-router-dom'
import { CalendarDays, Home, MessageCircle, Search, User } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

type Tab = { to: string; label: string; icon: typeof Home; match?: (path: string) => boolean }

const CUSTOMER_TABS: Tab[] = [
  { to: '/services', label: 'Services', icon: Home, match: (p) => p === '/' || p.startsWith('/services') },
  { to: '/providers', label: 'Book', icon: Search, match: (p) => p.startsWith('/providers') },
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
  {
    to: '/dashboard/profile',
    label: 'Profile',
    icon: User,
    match: (p) => p.startsWith('/dashboard/profile') || p === '/dashboard',
  },
]

type MobileBottomNavProps = {
  unreadMessages?: number
}

export function MobileBottomNav({ unreadMessages = 0 }: MobileBottomNavProps) {
  const { pathname } = useLocation()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
        {CUSTOMER_TABS.map(({ to, label, icon: Icon, match }) => {
          const active = match ? match(pathname) : pathname === to
          const showBadge = label === 'Messages' && unreadMessages > 0
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'relative flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2.5 text-[10px] font-medium transition',
                active ? 'text-nexo-700' : 'text-slate-500',
              )}
            >
              <span className="relative">
                <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 2} />
                {showBadge && (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-nexo-700 px-1 text-[9px] text-white">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </span>
              <span className="truncate">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
