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
