import { supabase } from '@/shared/lib/supabase'
import type { AuthResult } from '@/shared/services/authService'
import type { UserRole } from '@/shared/lib/constants'
import type { ProfileRow } from '@/shared/types/database'
import type { ProviderRow } from '@/shared/types/catalog'
import {
  mapAdminBooking,
  mapAdminProvider,
  mapAdminUser,
  emptyAdminProviderPaymentSummary,
  type AdminBooking,
  type AdminProvider,
  type AdminProviderPaymentSummary,
  type AdminStats,
  type AdminReports,
  type AdminUser,
} from '@/shared/types/admin'
import { mapActivityLog, type ActivityLog, type ActivityLogRow } from '@/shared/types/activity'
import type { PaymentKind, PaymentStatus } from '@/shared/types/payment'

function relationField<T extends Record<string, unknown>>(
  value: T | T[] | null | undefined,
  key: keyof T,
): string | null {
  const row = Array.isArray(value) ? value[0] : value
  if (!row) return null
  const field = row[key]
  return typeof field === 'string' ? field : null
}

type ProviderBookingPaymentRow = {
  provider_id: string
  payments:
    | { status: PaymentStatus; payment_kind: PaymentKind | null }[]
    | { status: PaymentStatus; payment_kind: PaymentKind | null }
    | null
}

function paymentRowsFromBooking(row: ProviderBookingPaymentRow) {
  if (!row.payments) return []
  return Array.isArray(row.payments) ? row.payments : [row.payments]
}

function accumulateProviderPayments(
  summaries: Map<string, AdminProviderPaymentSummary>,
  rows: ProviderBookingPaymentRow[],
) {
  for (const row of rows) {
    const summary = summaries.get(row.provider_id) ?? emptyAdminProviderPaymentSummary()
    for (const payment of paymentRowsFromBooking(row)) {
      const status = payment.status
      if (status === 'pending') summary.pending += 1
      else if (status === 'submitted') summary.submitted += 1
      else if (status === 'paid') summary.paid += 1
      else if (status === 'failed') summary.failed += 1
      else if (status === 'refunded') summary.refunded += 1

      if (
        payment.payment_kind === 'provider_admin_fee' &&
        (status === 'pending' || status === 'submitted')
      ) {
        summary.adminFeeDue += 1
      }
    }
    summaries.set(row.provider_id, summary)
  }
}

export const adminService = {
  async getStats(): Promise<AuthResult<AdminStats>> {
    const [users, providers, bookings, payments] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('providers').select('id', { count: 'exact', head: true }),
      supabase.from('bookings').select('status, total_price'),
      supabase.from('payments').select('status, amount'),
    ])

    if (users.error) return { data: null as unknown as AdminStats, error: users.error.message }
    if (providers.error) {
      return { data: null as unknown as AdminStats, error: providers.error.message }
    }
    if (bookings.error) {
      return { data: null as unknown as AdminStats, error: bookings.error.message }
    }
    if (payments.error) {
      return { data: null as unknown as AdminStats, error: payments.error.message }
    }

    const rows = bookings.data ?? []
    const paymentRows = payments.data ?? []
    const pendingBookings = rows.filter((b) => b.status === 'pending').length
    const completedBookings = rows.filter((b) => b.status === 'completed').length
    const totalRevenue = paymentRows
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount ?? 0), 0)
    const pendingPayments = paymentRows.filter((p) =>
      ['pending', 'submitted'].includes(p.status),
    ).length
    const paidPayments = paymentRows.filter((p) => p.status === 'paid').length

    return {
      data: {
        totalUsers: users.count ?? 0,
        totalProviders: providers.count ?? 0,
        totalBookings: rows.length,
        pendingBookings,
        completedBookings,
        totalRevenue,
        pendingPayments,
        paidPayments,
      },
      error: null,
    }
  },

  async getReports(): Promise<AuthResult<AdminReports>> {
    const [profiles, bookings, payments, reviews, activity] = await Promise.all([
      supabase.from('profiles').select('role'),
      supabase.from('bookings').select('status, payment_method, service_id, created_at, services ( name )'),
      supabase.from('payments').select('status, amount, created_at'),
      supabase.from('reviews').select('rating'),
      supabase.from('activity_logs').select('id', { count: 'exact', head: true }),
    ])

    if (profiles.error) return { data: null as unknown as AdminReports, error: profiles.error.message }
    if (bookings.error) return { data: null as unknown as AdminReports, error: bookings.error.message }
    if (payments.error) return { data: null as unknown as AdminReports, error: payments.error.message }
    if (reviews.error) return { data: null as unknown as AdminReports, error: reviews.error.message }

    const roleCounts = new Map<string, number>()
    for (const p of profiles.data ?? []) {
      const role = (p.role as string) ?? 'customer'
      roleCounts.set(role, (roleCounts.get(role) ?? 0) + 1)
    }

    const statusCounts = new Map<string, number>()
    const paymentMethodCounts = new Map<string, number>()
    const serviceCounts = new Map<string, number>()
    const last30 = new Map<string, number>()
    const now = Date.now()
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000

    for (const b of bookings.data ?? []) {
      const status = (b.status as string) ?? 'unknown'
      statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1)
      const method = (b.payment_method as string) ?? 'unknown'
      paymentMethodCounts.set(method, (paymentMethodCounts.get(method) ?? 0) + 1)
      const serviceName =
        relationField(b.services as { name: string } | { name: string }[] | null, 'name') ?? 'Unknown'
      serviceCounts.set(serviceName, (serviceCounts.get(serviceName) ?? 0) + 1)
      const created = new Date(b.created_at as string).getTime()
      if (created >= thirtyDaysAgo) {
        const key = new Date(b.created_at as string).toLocaleDateString('en-CA', {
          timeZone: 'Asia/Singapore',
        })
        last30.set(key, (last30.get(key) ?? 0) + 1)
      }
    }

    const monthRevenue = new Map<string, number>()
    for (const p of payments.data ?? []) {
      if (p.status !== 'paid') continue
      const key = new Date(p.created_at as string).toLocaleDateString('en-SG', {
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Singapore',
      })
      monthRevenue.set(key, (monthRevenue.get(key) ?? 0) + Number(p.amount ?? 0))
    }

    const reviewRows = reviews.data ?? []
    const avgRating =
      reviewRows.length > 0
        ? reviewRows.reduce((sum, r) => sum + Number(r.rating ?? 0), 0) / reviewRows.length
        : 0

    const sortedMonths = [...monthRevenue.entries()]
      .slice(-6)
      .map(([month, amount]) => ({ month, amount }))

    const sortedServices = [...serviceCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

    const sortedLast30 = [...last30.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }))

    return {
      data: {
        usersByRole: [...roleCounts.entries()].map(([role, count]) => ({ role, count })),
        bookingsByStatus: [...statusCounts.entries()].map(([status, count]) => ({ status, count })),
        bookingsByPaymentMethod: [...paymentMethodCounts.entries()].map(([method, count]) => ({
          method,
          count,
        })),
        revenueByMonth: sortedMonths,
        topServices: sortedServices,
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews: reviewRows.length,
        bookingsLast30Days: sortedLast30,
        recentActivityCount: activity.count ?? 0,
      },
      error: null,
    }
  },

  async listUsers(): Promise<AuthResult<AdminUser[]>> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return { data: [], error: error.message }
    return { data: (data as ProfileRow[]).map(mapAdminUser), error: null }
  },

  async setUserActive(userId: string, isActive: boolean): Promise<AuthResult<AdminUser>> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_active: isActive })
      .eq('user_id', userId)
      .select('*')
      .single()

    if (error) return { data: null as unknown as AdminUser, error: error.message }

    await supabase.rpc('log_audit_action', {
      p_action: isActive ? 'activate_user' : 'deactivate_user',
      p_entity_type: 'profile',
      p_entity_id: userId,
      p_details: {},
    })

    return { data: mapAdminUser(data as ProfileRow), error: null }
  },

  async setUserRole(userId: string, role: UserRole): Promise<AuthResult<AdminUser>> {
    const { data, error } = await supabase.rpc('admin_set_user_role', {
      p_user_id: userId,
      p_role: role,
    })

    if (error) return { data: null as unknown as AdminUser, error: error.message }
    return { data: mapAdminUser(data as ProfileRow), error: null }
  },

  async listProviders(): Promise<AuthResult<AdminProvider[]>> {
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return { data: [], error: error.message }

    const listings = (data as ProviderRow[]).map(mapAdminProvider)
    if (!listings.length) return { data: listings, error: null }

    const providerIds = listings.map((p) => p.id)
    const userIds = listings.map((p) => p.userId)

    const [{ data: profiles }, { data: bookingPayments }] = await Promise.all([
      supabase.from('profiles').select('user_id, avatar_url, phone, whatsapp').in('user_id', userIds),
      supabase
        .from('bookings')
        .select('provider_id, payments ( status, payment_kind )')
        .in('provider_id', providerIds),
    ])

    const profileByUser = new Map(
      (profiles ?? []).map((p) => [
        p.user_id as string,
        {
          avatarUrl: (p.avatar_url as string | null) ?? null,
          phone: (p.phone as string | null) ?? null,
          whatsApp: (p.whatsapp as string | null) ?? null,
        },
      ]),
    )

    const paymentSummaryByProvider = new Map<string, AdminProviderPaymentSummary>()
    for (const providerId of providerIds) {
      paymentSummaryByProvider.set(providerId, emptyAdminProviderPaymentSummary())
    }
    accumulateProviderPayments(
      paymentSummaryByProvider,
      (bookingPayments ?? []) as ProviderBookingPaymentRow[],
    )

    return {
      data: listings.map((provider) => {
        const profile = profileByUser.get(provider.userId)
        return {
          ...provider,
          avatarUrl: profile?.avatarUrl ?? provider.avatarUrl,
          phone: profile?.phone ?? null,
          whatsApp: profile?.whatsApp ?? null,
          paymentSummary:
            paymentSummaryByProvider.get(provider.id) ?? emptyAdminProviderPaymentSummary(),
        }
      }),
      error: null,
    }
  },

  async deleteUser(userId: string): Promise<AuthResult<null>> {
    const { error } = await supabase.rpc('admin_delete_user', { p_user_id: userId })
    if (error) return { data: null, error: error.message }
    return { data: null, error: null }
  },

  async deleteProvider(providerId: string): Promise<AuthResult<null>> {
    const { error } = await supabase.rpc('admin_delete_provider', { p_provider_id: providerId })
    if (error) return { data: null, error: error.message }
    return { data: null, error: null }
  },

  async setProviderVerified(providerId: string, isVerified: boolean): Promise<AuthResult<AdminProvider>> {
    if (isVerified) {
      const { data: providerRow, error: providerError } = await supabase
        .from('providers')
        .select('user_id')
        .eq('id', providerId)
        .maybeSingle()

      if (providerError || !providerRow) {
        return {
          data: null as unknown as AdminProvider,
          error: providerError?.message ?? 'Provider not found',
        }
      }

      const { data: profileRow, error: profileError } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('user_id', providerRow.user_id)
        .maybeSingle()

      if (profileError) {
        return { data: null as unknown as AdminProvider, error: profileError.message }
      }

      if (!profileRow?.avatar_url) {
        return {
          data: null as unknown as AdminProvider,
          error: 'Provider must upload a profile photo before verification.',
        }
      }
    }

    const { data, error } = await supabase
      .from('providers')
      .update({ is_verified: isVerified })
      .eq('id', providerId)
      .select('*')
      .single()

    if (error) return { data: null as unknown as AdminProvider, error: error.message }

    await supabase.rpc('log_audit_action', {
      p_action: isVerified ? 'verify_provider' : 'unverify_provider',
      p_entity_type: 'provider',
      p_entity_id: providerId,
      p_details: {},
    })

    const listing = mapAdminProvider(data as ProviderRow)
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('user_id', listing.userId)
      .maybeSingle()

    return {
      data: {
        ...listing,
        avatarUrl: (profile?.avatar_url as string | null) ?? listing.avatarUrl,
      },
      error: null,
    }
  },

  async listBookings(): Promise<AuthResult<AdminBooking[]>> {
    const { data: rows, error } = await supabase
      .from('bookings')
      .select(
        `
        *,
        providers ( business_name ),
        services ( name )
      `,
      )
      .order('created_at', { ascending: false })

    if (error) return { data: [], error: error.message }
    if (!rows?.length) return { data: [], error: null }

    const customerIds = [...new Set(rows.map((r) => r.customer_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, email')
      .in('user_id', customerIds)

    const emailByUser = new Map(profiles?.map((p) => [p.user_id, p.email]) ?? [])

    return {
      data: rows.map((row) => ({
        ...mapAdminBooking(row as Parameters<typeof mapAdminBooking>[0]),
        customerEmail: emailByUser.get(row.customer_id),
      })),
      error: null,
    }
  },

  async listActivityLogs(limit = 100): Promise<AuthResult<ActivityLog[]>> {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) return { data: [], error: error.message }
    return { data: (data as ActivityLogRow[]).map(mapActivityLog), error: null }
  },

  async listAuditLogs(limit = 50): Promise<AuthResult<ActivityLog[]>> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('id, admin_id, action, entity_type, entity_id, details, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) return { data: [], error: error.message }

    return {
      data: (data ?? []).map((row) => ({
        id: row.id as string,
        actorId: row.admin_id as string,
        actorRole: 'admin' as const,
        action: row.action as string,
        entityType: row.entity_type as string,
        entityId: row.entity_id as string | null,
        summary: `${row.action} on ${row.entity_type}`,
        details: (row.details as Record<string, unknown>) ?? {},
        createdAt: row.created_at as string,
      })),
      error: null,
    }
  },
}
