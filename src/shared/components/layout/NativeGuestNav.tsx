import { CalendarDays, Home, UserRound } from 'lucide-react'
import { NativeTabBar, type NativeTab } from '@/shared/components/layout/NativeTabBar'

const GUEST_TABS: NativeTab[] = [
  {
    to: '/',
    label: 'Home',
    icon: Home,
    match: (p) => p === '/',
  },
  {
    to: '/services/cleaning/request',
    label: 'Book',
    icon: CalendarDays,
    match: (p) => p.startsWith('/services') || p.startsWith('/providers'),
  },
  {
    to: '/login',
    label: 'Account',
    icon: UserRound,
    match: (p) => p.startsWith('/login') || p.startsWith('/register'),
  },
]

export function NativeGuestNav() {
  return <NativeTabBar tabs={GUEST_TABS} />
}
