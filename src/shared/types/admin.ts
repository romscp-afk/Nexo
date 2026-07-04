import type { UserProfile, ProfileRow } from '@/shared/types/database'
import { mapProfileRow } from '@/shared/types/database'
import type { ProviderListing, ProviderRow } from '@/shared/types/catalog'
import { mapProviderListing } from '@/shared/types/catalog'
import type { Booking, BookingRow } from '@/shared/types/booking'
import { mapBooking } from '@/shared/types/booking'

export type AdminStats = {
  totalUsers: number
  totalProviders: number
  totalBookings: number
  pendingBookings: number
  completedBookings: number
  totalRevenue: number
  pendingPayments: number
  paidPayments: number
}

export type AdminReports = {
  usersByRole: { role: string; count: number }[]
  bookingsByStatus: { status: string; count: number }[]
  bookingsByPaymentMethod: { method: string; count: number }[]
  revenueByMonth: { month: string; amount: number }[]
  topServices: { name: string; count: number }[]
  averageRating: number
  totalReviews: number
  bookingsLast30Days: { date: string; count: number }[]
  recentActivityCount: number
}

export type AdminUser = UserProfile

export type AdminProvider = ProviderListing

export type AdminBooking = Booking & {
  customerEmail?: string
}

export type AdminChatThread = {
  bookingId: string
  messageCount: number
  lastMessageBody: string
  lastMessageAt: string
  lastSenderName: string
  bookingStatus: string
  serviceName: string | null
  providerName: string | null
  customerName: string
  customerEmail: string | null
}

type BookingAdminRow = BookingRow & {
  providers: { business_name: string } | null
  services: { name: string } | null
  profiles: { email: string; full_name: string } | null
}

export function mapAdminBooking(row: BookingAdminRow): AdminBooking {
  return {
    ...mapBooking(row, {
      providerName: row.providers?.business_name,
      serviceName: row.services?.name,
    }),
    customerEmail: row.profiles?.email,
  }
}

export function mapAdminUser(row: ProfileRow): AdminUser {
  return mapProfileRow(row)
}

export function mapAdminProvider(row: ProviderRow): AdminProvider {
  return mapProviderListing(row)
}
