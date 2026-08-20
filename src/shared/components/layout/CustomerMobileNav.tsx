import { useState } from 'react'
import { MobileBottomNav } from '@/shared/components/layout/MobileBottomNav'
import { MobileMoreSheet } from '@/shared/components/layout/MobileMoreSheet'
import { useUnreadNotificationCount } from '@/features/customer/hooks/useNotifications'
import { useUnreadChatCount } from '@/features/bookings/hooks/useBookingChat'

type CustomerMobileNavProps = {
  forceVisible?: boolean
}

/** Bottom tab bar + More sheet for logged-in customers on mobile / native app. */
export function CustomerMobileNav({ forceVisible = false }: CustomerMobileNavProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const unreadNotifications = useUnreadNotificationCount()
  const { data: unreadChat = 0 } = useUnreadChatCount('customer')

  return (
    <>
      <MobileBottomNav
        unreadMessages={unreadChat}
        moreBadge={unreadNotifications}
        onMoreClick={() => setMoreOpen(true)}
        forceVisible={forceVisible}
      />
      <MobileMoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        unreadNotifications={unreadNotifications}
      />
    </>
  )
}
