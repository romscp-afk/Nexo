import { supabase } from '@/shared/lib/supabase'
import type { AuthResult } from '@/shared/services/authService'
import type { ProfileRow } from '@/shared/types/database'
import type { ProviderRow } from '@/shared/types/catalog'
import {
  mapAdminBooking,
  mapAdminProvider,
  mapAdminUser,
  type AdminBooking,
  type AdminProvider,
  type AdminStats,
  type AdminReports,
  type AdminUser,
} from '@/shared/types/admin'
import { mapActivityLog, type ActivityLog, type ActivityLogRow } from '@/shared/types/activity'

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
      const serviceName = (b.services as { name: string } | null)?.name ?? 'Unknown'
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

  async listProviders(): Promise<AuthResult<AdminProvider[]>> {
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return { data: [], error: error.message }
    return { data: (data as ProviderRow[]).map(mapAdminProvider), error: null }
  },

  async setProviderVerified(providerId: string, isVerified: boolean): Promise<AuthResult<AdminProvider>> {
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

    return { data: mapAdminProvider(data as ProviderRow), error: null }
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
