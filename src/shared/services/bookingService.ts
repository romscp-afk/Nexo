import { supabase } from '@/shared/lib/supabase'
import type { AuthResult } from '@/shared/services/authService'
import {
  mapBooking,
  mapBookingStatusHistory,
  type Booking,
  type BookingRow,
  type BookingStatus,
  type BookingStatusHistoryEntry,
  type CreateBookingInput,
} from '@/shared/types/booking'

type BookingJoinRow = BookingRow & {
  providers: { business_name: string } | null
  services: {
    name: string
    service_categories: { name: string } | null
  } | null
}

const BOOKING_SELECT = `
  *,
  providers ( business_name ),
  services (
    name,
    service_categories ( name )
  )
`

function mapJoinRow(row: BookingJoinRow): Booking {
  const paymentFromNotes = row.notes?.match(/\[Payment:\s*(paynow|cash)\]/i)?.[1]?.toLowerCase()
  const booking = mapBooking(row, {
    providerName: row.providers?.business_name ?? (row.provider_id ? undefined : 'Open — awaiting provider'),
    serviceName: row.services?.name,
    categoryName: row.services?.service_categories?.name,
  })
  if (!row.payment_method && (paymentFromNotes === 'paynow' || paymentFromNotes === 'cash')) {
    booking.paymentMethod = paymentFromNotes
  }
  return booking
}

async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

export const bookingService = {
  async create(input: CreateBookingInput): Promise<AuthResult<Booking>> {
    const userId = await getCurrentUserId()
    if (!userId) return { data: null as unknown as Booking, error: 'Not authenticated' }

    const notesWithPayment =
      input.notes?.includes('[Payment:')
        ? input.notes
        : `[Payment: ${input.paymentMethod}]${input.notes ? ` ${input.notes}` : ''}`

    const payload = {
      customer_id: userId,
      provider_id: input.providerId ?? null,
      service_id: input.serviceId,
      scheduled_at: input.scheduledAt,
      duration_hours: input.durationHours,
      address_line1: input.addressLine1,
      address_line2: input.addressLine2 ?? null,
      postal_code: input.postalCode,
      notes: notesWithPayment,
      total_price: input.totalPrice,
      status: 'pending' as const,
    }

    let { data, error } = await supabase
      .from('bookings')
      .insert({ ...payload, payment_method: input.paymentMethod })
      .select(BOOKING_SELECT)
      .single()

    if (error?.message && (error.message.includes('payment_method') || error.message.includes("'payment_method'"))) {
      ;({ data, error } = await supabase
        .from('bookings')
        .insert(payload)
        .select(BOOKING_SELECT)
        .single())
    }

    if (error) return { data: null as unknown as Booking, error: error.message }
    const booking = mapJoinRow(data as BookingJoinRow)
    if (!data.payment_method) {
      booking.paymentMethod = input.paymentMethod
    }
    return { data: booking, error: null }
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
    return { data: (data as BookingJoinRow[]).map(mapJoinRow), error: null }
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
    return { data: (data as BookingJoinRow[]).map(mapJoinRow), error: null }
  },

  async listOpenForProvider(): Promise<AuthResult<Booking[]>> {
    const userId = await getCurrentUserId()
    if (!userId) return { data: [], error: 'Not authenticated' }

    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (providerError) return { data: [], error: providerError.message }
    if (!provider) return { data: [], error: null }

    const { data: services, error: servicesError } = await supabase
      .from('provider_services')
      .select('service_id')
      .eq('provider_id', provider.id)

    if (servicesError) return { data: [], error: servicesError.message }
    const serviceIds = services?.map((s) => s.service_id) ?? []
    if (!serviceIds.length) return { data: [], error: null }

    const { data, error } = await supabase
      .from('bookings')
      .select(BOOKING_SELECT)
      .is('provider_id', null)
      .eq('status', 'pending')
      .in('service_id', serviceIds)
      .order('created_at', { ascending: false })

    if (error) return { data: [], error: error.message }
    return { data: (data as BookingJoinRow[]).map(mapJoinRow), error: null }
  },

  async acceptOpenBooking(bookingId: string): Promise<AuthResult<Booking>> {
    const { error } = await supabase.rpc('provider_accept_booking', {
      p_booking_id: bookingId,
    })

    if (error) return { data: null as unknown as Booking, error: error.message }

    return bookingService.getById(bookingId) as Promise<AuthResult<Booking>>
  },

  async getById(id: string): Promise<AuthResult<Booking | null>> {
    const { data, error } = await supabase
      .from('bookings')
      .select(BOOKING_SELECT)
      .eq('id', id)
      .maybeSingle()

    if (error) return { data: null, error: error.message }
    if (!data) return { data: null, error: null }

    const booking = mapJoinRow(data as BookingJoinRow)

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('user_id', booking.customerId)
      .maybeSingle()

    if (profile && booking.customerContactShared) {
      booking.customerName = profile.full_name
      booking.customerPhone = profile.phone ?? undefined
    }

    return { data: booking, error: null }
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

  async getStatusHistory(bookingId: string): Promise<AuthResult<BookingStatusHistoryEntry[]>> {
    const { data, error } = await supabase
      .from('booking_status_history')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true })

    if (error) return { data: [], error: error.message }
    return { data: data.map(mapBookingStatusHistory), error: null }
  },
}
