import { useState } from 'react'
import { CalendarDays, LayoutGrid, Menu, MessageCircle, Sparkles } from 'lucide-react'
import { MobileMoreSheet } from '@/shared/components/layout/MobileMoreSheet'
import { NativeTabBar, type NativeTab } from '@/shared/components/layout/NativeTabBar'
import { useUnreadNotificationCount } from '@/features/customer/hooks/useNotifications'
import { useUnreadChatCount } from '@/features/bookings/hooks/useBookingChat'
import { isNativeApp } from '@/shared/lib/nativeApp'
import { PRIMARY_CATEGORY_SLUG } from '@/shared/lib/catalogConfig'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/shared/lib/utils'

type CustomerMobileNavProps = {
  forceVisible?: boolean
}

function useCustomerTabs(): NativeTab[] {
  const native = isNativeApp()
  return [
    {
      to: native ? '/dashboard' : `/services/${PRIMARY_CATEGORY_SLUG}`,
      label: 'Home',
      icon: LayoutGrid,
      match: (p) => (native ? p === '/dashboard' || p === '/' : p === '/' || p.startsWith('/services')),
    },
    {
      to: '/services/cleaning/request',
      label: 'Book',
      icon: Sparkles,
      match: (p) => p.startsWith('/services/cleaning/request') || p.startsWith('/providers'),
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
}

/** Bottom tab bar + More sheet for logged-in customers on mobile / native app. */
export function CustomerMobileNav({ forceVisible = false }: CustomerMobileNavProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const unreadNotifications = useUnreadNotificationCount()
  const { data: unreadChat = 0 } = useUnreadChatCount('customer')
  const native = isNativeApp()
  const tabs = useCustomerTabs().map((tab) =>
    tab.label === 'Messages' ? { ...tab, badge: unreadChat } : tab.label === 'More' ? { ...tab, badge: unreadNotifications } : tab,
  )

  if (native || forceVisible) {
    return (
      <>
        <NativeTabBar tabs={tabs} onMoreClick={() => setMoreOpen(true)} />
        <MobileMoreSheet
          open={moreOpen}
          onClose={() => setMoreOpen(false)}
          unreadNotifications={unreadNotifications}
        />
      </>
    )
  }

  return <LegacyCustomerBottomNav forceVisible={forceVisible} />
}

/** Web responsive fallback (hidden on md+). */
function LegacyCustomerBottomNav({ forceVisible }: { forceVisible: boolean }) {
  const [moreOpen, setMoreOpen] = useState(false)
  const unreadNotifications = useUnreadNotificationCount()
  const { data: unreadChat = 0 } = useUnreadChatCount('customer')
  const { pathname } = useLocation()
  const tabs = useCustomerTabs()

  return (
    <>
      <nav
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 border-t border-brand-border bg-brand-surface',
          !forceVisible && 'md:hidden',
        )}
        aria-label="Main navigation"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto flex h-14 max-w-lg items-stretch justify-around px-1">
          {tabs.map(({ to, label, icon: Icon, match, action }) => {
            const active = action === 'more' ? false : match ? match(pathname) : pathname === to
            const badge =
              label === 'Messages' ? unreadChat : label === 'More' ? unreadNotifications : 0
            const className = cn(
              'relative flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold',
              active ? 'text-brand-primary' : 'text-brand-text-muted',
            )
            const inner = (
              <>
                <span className="relative">
                  <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.5 : 2} />
                  {badge > 0 && (
                    <span className="absolute -right-2 -top-1 rounded-full bg-brand-primary px-1 text-[9px] text-white">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </span>
                {label}
              </>
            )
            if (action === 'more') {
              return (
                <button key={label} type="button" className={className} onClick={() => setMoreOpen(true)}>
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
      <MobileMoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        unreadNotifications={unreadNotifications}
      />
    </>
  )
}
