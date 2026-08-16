import { useState } from 'react'
import { MobileBottomNav } from '@/shared/components/layout/MobileBottomNav'
import { MobileMoreSheet } from '@/shared/components/layout/MobileMoreSheet'
import { useUnreadNotificationCount } from '@/features/customer/hooks/useNotifications'
import { useUnreadChatCount } from '@/features/bookings/hooks/useBookingChat'

/** Bottom tab bar + More sheet for logged-in customers on mobile/PWA. */
export function CustomerMobileNav() {
  const [moreOpen, setMoreOpen] = useState(false)
  const unreadNotifications = useUnreadNotificationCount()
  const { data: unreadChat = 0 } = useUnreadChatCount('customer')

  return (
    <>
      <MobileBottomNav
        unreadMessages={unreadChat}
        moreBadge={unreadNotifications}
        onMoreClick={() => setMoreOpen(true)}
      />
      <MobileMoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        unreadNotifications={unreadNotifications}
      />
    </>
  )
}
