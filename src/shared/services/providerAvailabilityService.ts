import { supabase } from '@/shared/lib/supabase'
import type { AuthResult } from '@/shared/services/authService'
import {
  defaultWeeklyHours,
  mapTimeOff,
  mapWeeklyHour,
  type ProviderTimeOff,
  type ProviderWeeklyHour,
  type ProviderWeeklyHourRow,
  type WeeklyHourInput,
} from '@/shared/types/availability'

async function getMyProviderId(): Promise<string | null> {
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return null
  const { data } = await supabase.from('providers').select('id').eq('user_id', user.user.id).maybeSingle()
  return (data?.id as string) ?? null
}

export const providerAvailabilityService = {
  async getWeeklyHours(providerId: string): Promise<AuthResult<ProviderWeeklyHour[]>> {
    const { data, error } = await supabase
      .from('provider_weekly_hours')
      .select('*')
      .eq('provider_id', providerId)
      .order('day_of_week')

    if (error) return { data: [], error: error.message }

    const rows = (data ?? []) as ProviderWeeklyHourRow[]
    if (!rows.length) {
      return {
        data: defaultWeeklyHours().map((h, i) => ({
          id: `default-${i}`,
          providerId,
          dayOfWeek: h.dayOfWeek,
          isAvailable: h.isAvailable,
          startTime: h.startTime,
          endTime: h.endTime,
        })),
        error: null,
      }
    }

    return { data: rows.map(mapWeeklyHour), error: null }
  },

  async getMyWeeklyHours(): Promise<AuthResult<ProviderWeeklyHour[]>> {
    const providerId = await getMyProviderId()
    if (!providerId) return { data: [], error: 'Provider profile not found' }
    return providerAvailabilityService.getWeeklyHours(providerId)
  },

  async updateMyWeeklyHours(hours: WeeklyHourInput[]): Promise<AuthResult<ProviderWeeklyHour[]>> {
    const providerId = await getMyProviderId()
    if (!providerId) return { data: [], error: 'Provider profile not found' }

    const { error: deleteError } = await supabase
      .from('provider_weekly_hours')
      .delete()
      .eq('provider_id', providerId)
    if (deleteError) return { data: [], error: deleteError.message }

    const { error: insertError } = await supabase.from('provider_weekly_hours').insert(
      hours.map((h) => ({
        provider_id: providerId,
        day_of_week: h.dayOfWeek,
        is_available: h.isAvailable,
        start_time: h.startTime,
        end_time: h.endTime,
      })),
    )
    if (insertError) return { data: [], error: insertError.message }

    return providerAvailabilityService.getWeeklyHours(providerId)
  },

  async checkSlot(
    providerId: string,
    scheduledAt: string,
    durationHours: number,
    excludeBookingId?: string,
  ): Promise<AuthResult<{ ok: boolean; reason?: string }>> {
    const { data, error } = await supabase.rpc('check_provider_booking_slot', {
      p_provider_id: providerId,
      p_scheduled_at: scheduledAt,
      p_duration_hours: durationHours,
      p_exclude_booking_id: excludeBookingId ?? null,
    })

    if (error) return { data: { ok: false, reason: error.message }, error: error.message }

    const result = data as { ok: boolean; reason?: string }
    return { data: result, error: null }
  },

  async listTimeOff(providerId: string): Promise<AuthResult<ProviderTimeOff[]>> {
    const { data, error } = await supabase
      .from('provider_time_off')
      .select('*')
      .eq('provider_id', providerId)
      .gte('end_at', new Date().toISOString())
      .order('start_at')

    if (error) return { data: [], error: error.message }
    return { data: (data ?? []).map(mapTimeOff), error: null }
  },

  async listMyTimeOff(): Promise<AuthResult<ProviderTimeOff[]>> {
    const providerId = await getMyProviderId()
    if (!providerId) return { data: [], error: 'Provider profile not found' }
    return providerAvailabilityService.listTimeOff(providerId)
  },

  async addTimeOff(input: {
    startAt: string
    endAt: string
    label?: string
  }): Promise<AuthResult<ProviderTimeOff>> {
    const providerId = await getMyProviderId()
    if (!providerId) return { data: null as never, error: 'Provider profile not found' }

    const { data, error } = await supabase
      .from('provider_time_off')
      .insert({
        provider_id: providerId,
        start_at: input.startAt,
        end_at: input.endAt,
        label: input.label ?? null,
      })
      .select('*')
      .single()

    if (error) return { data: null as never, error: error.message }
    return { data: mapTimeOff(data), error: null }
  },

  async deleteTimeOff(id: string): Promise<AuthResult<null>> {
    const providerId = await getMyProviderId()
    if (!providerId) return { data: null, error: 'Provider profile not found' }

    const { error } = await supabase
      .from('provider_time_off')
      .delete()
      .eq('id', id)
      .eq('provider_id', providerId)

    if (error) return { data: null, error: error.message }
    return { data: null, error: null }
  },
}
