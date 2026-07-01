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

export const adminService = {
  async getStats(): Promise<AuthResult<AdminStats>> {
    const [users, providers, bookings] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('providers').select('id', { count: 'exact', head: true }),
      supabase.from('bookings').select('status, total_price'),
    ])

    if (users.error) return { data: null as unknown as AdminStats, error: users.error.message }
    if (providers.error) {
      return { data: null as unknown as AdminStats, error: providers.error.message }
    }
    if (bookings.error) {
      return { data: null as unknown as AdminStats, error: bookings.error.message }
    }

    const rows = bookings.data ?? []
    const pendingBookings = rows.filter((b) => b.status === 'pending').length
    const completedBookings = rows.filter((b) => b.status === 'completed').length
    const totalRevenue = rows
      .filter((b) => b.status === 'completed')
      .reduce((sum, b) => sum + Number(b.total_price ?? 0), 0)

    return {
      data: {
        totalUsers: users.count ?? 0,
        totalProviders: providers.count ?? 0,
        totalBookings: rows.length,
        pendingBookings,
        completedBookings,
        totalRevenue,
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
}
