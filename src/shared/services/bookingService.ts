import { supabase } from '@/shared/lib/supabase'
import type { AuthResult } from '@/shared/services/authService'
import {
  mapBooking,
  type Booking,
  type BookingRow,
  type BookingStatus,
  type CreateBookingInput,
} from '@/shared/types/booking'

type BookingJoinRow = BookingRow & {
  providers: { business_name: string } | null
  services: { name: string } | null
}

const BOOKING_SELECT = `
  *,
  providers ( business_name ),
  services ( name )
`

function mapJoinRow(row: BookingJoinRow): Booking {
  return mapBooking(row, {
    providerName: row.providers?.business_name,
    serviceName: row.services?.name,
  })
}

async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

export const bookingService = {
  async create(input: CreateBookingInput): Promise<AuthResult<Booking>> {
    const userId = await getCurrentUserId()
    if (!userId) return { data: null as unknown as Booking, error: 'Not authenticated' }

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        customer_id: userId,
        provider_id: input.providerId,
        service_id: input.serviceId,
        scheduled_at: input.scheduledAt,
        duration_hours: input.durationHours,
        address_line1: input.addressLine1,
        address_line2: input.addressLine2 ?? null,
        postal_code: input.postalCode,
        notes: input.notes ?? null,
        total_price: input.totalPrice,
        status: 'pending',
      })
      .select(BOOKING_SELECT)
      .single()

    if (error) return { data: null as unknown as Booking, error: error.message }
    return { data: mapJoinRow(data as BookingJoinRow), error: null }
  },

  async listForCustomer(): Promise<AuthResult<Booking[]>> {
    const userId = await getCurrentUserId()
    if (!userId) return { data: [], error: 'Not authenticated' }

    const { data, error } = await supabase
      .from('bookings')
      .select(BOOKING_SELECT)
      .eq('customer_id', userId)
      .order('scheduled_at', { ascending: false })

    if (error) return { data: [], error: error.message }
    return {
      data: (data as BookingJoinRow[]).map(mapJoinRow),
      error: null,
    }
  },

  async listForProvider(): Promise<AuthResult<Booking[]>> {
    const userId = await getCurrentUserId()
    if (!userId) return { data: [], error: 'Not authenticated' }

    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (providerError) return { data: [], error: providerError.message }
    if (!provider) return { data: [], error: null }

    const { data, error } = await supabase
      .from('bookings')
      .select(BOOKING_SELECT)
      .eq('provider_id', provider.id)
      .order('scheduled_at', { ascending: false })

    if (error) return { data: [], error: error.message }
    return {
      data: (data as BookingJoinRow[]).map(mapJoinRow),
      error: null,
    }
  },

  async getById(id: string): Promise<AuthResult<Booking | null>> {
    const { data, error } = await supabase
      .from('bookings')
      .select(BOOKING_SELECT)
      .eq('id', id)
      .maybeSingle()

    if (error) return { data: null, error: error.message }
    return {
      data: data ? mapJoinRow(data as BookingJoinRow) : null,
      error: null,
    }
  },

  async updateStatus(id: string, status: BookingStatus): Promise<AuthResult<Booking>> {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)
      .select(BOOKING_SELECT)
      .single()

    if (error) return { data: null as unknown as Booking, error: error.message }
    return { data: mapJoinRow(data as BookingJoinRow), error: null }
  },

  async cancel(id: string): Promise<AuthResult<Booking>> {
    return bookingService.updateStatus(id, 'cancelled')
  },
}
