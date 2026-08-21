import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Banknote,
  Bell,
  CalendarDays,
  ClipboardList,
  Home,
  Menu,
  MessageCircle,
  User,
  X,
} from 'lucide-react'
import { useUnreadNotificationCount } from '@/features/customer/hooks/useNotifications'
import { useUnreadChatCount } from '@/features/bookings/hooks/useBookingChat'
import { LogoutButton } from '@/shared/components/layout/LogoutButton'
import { NativeTabBar, type NativeTab } from '@/shared/components/layout/NativeTabBar'
import { Portal } from '@/shared/components/layout/Portal'
import { useAuth } from '@/features/auth/context/AuthProvider'

export function ProviderMobileNav() {
  const [moreOpen, setMoreOpen] = useState(false)
  const unreadNotifications = useUnreadNotificationCount()
  const { data: unreadChat = 0 } = useUnreadChatCount('provider')

  const tabs: NativeTab[] = [
    {
      to: '/provider',
      label: 'Today',
      icon: Home,
      match: (p) => p === '/provider',
    },
    {
      to: '/provider/bookings',
      label: 'Requests',
      icon: ClipboardList,
      match: (p) => p.startsWith('/provider/bookings'),
    },
    {
      to: '/provider/schedule',
      label: 'Schedule',
      icon: CalendarDays,
      match: (p) => p.startsWith('/provider/schedule'),
    },
    {
      to: '/provider/messages',
      label: 'Messages',
      icon: MessageCircle,
      match: (p) => p.startsWith('/provider/messages'),
      badge: unreadChat,
    },
    {
      label: 'More',
      icon: Menu,
      action: 'more',
      badge: unreadNotifications,
    },
  ]

  return (
    <>
      <NativeTabBar tabs={tabs} onMoreClick={() => setMoreOpen(true)} />
      {moreOpen && <ProviderMoreSheet onClose={() => setMoreOpen(false)} unread={unreadNotifications} />}
    </>
  )
}

function ProviderMoreSheet({ onClose, unread }: { onClose: () => void; unread: number }) {
  const { user } = useAuth()

  return (
    <Portal>
      <div className="fixed inset-0 z-[70]">
        <button type="button" className="absolute inset-0 bg-slate-900/50" onClick={onClose} aria-label="Close" />
        <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <p className="text-lg font-semibold text-slate-900">More</p>
              {user?.fullName && <p className="text-sm text-slate-500">{user.fullName}</p>}
            </div>
            <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-500" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="space-y-1 p-3">
            <SheetLink to="/provider/earnings" icon={Banknote} label="Earnings" onClose={onClose} />
            <SheetLink
              to="/provider/notifications"
              icon={Bell}
              label="Notifications"
              badge={unread}
              onClose={onClose}
            />
            <SheetLink to="/provider/profile" icon={User} label="Profile" onClose={onClose} />
            <SheetLink to="/provider/support" icon={ClipboardList} label="Support" onClose={onClose} />
            <div className="mt-2 border-t border-slate-100 pt-2">
              <LogoutButton variant="sidebar" onLogout={onClose} />
            </div>
          </nav>
        </div>
      </div>
    </Portal>
  )
}

function SheetLink({
  to,
  icon: Icon,
  label,
  badge,
  onClose,
}: {
  to: string
  icon: typeof Home
  label: string
  badge?: number
  onClose: () => void
}) {
  return (
    <Link
      to={to}
      onClick={onClose}
      className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium text-slate-800 active:bg-slate-100"
    >
      <Icon className="h-5 w-5 shrink-0 text-brand-primary" />
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="rounded-full bg-brand-primary px-2 py-0.5 text-xs font-semibold text-white">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  )
}
