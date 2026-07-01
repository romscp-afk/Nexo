import { supabase } from '@/shared/lib/supabase'
import type { AuthResult } from '@/shared/services/authService'
import {
  mapPayment,
  type AdminPayment,
  type Payment,
  type PaymentKind,
  type PaymentRow,
} from '@/shared/types/payment'
import type { BookingPaymentMethod } from '@/shared/types/booking'

type PaymentBookingJoin = PaymentRow & {
  bookings: {
    status: string
    providers: { business_name: string } | null
    services: { name: string } | null
  } | null
}

export type BookingPayments = {
  customerAdvance: Payment | null
  providerAdminFee: Payment | null
}

function paymentKindToBookingMethod(kind: PaymentKind): BookingPaymentMethod {
  return kind === 'provider_admin_fee' ? 'cash' : 'paynow'
}

function isMissingColumnError(message: string, column: string): boolean {
  return message.includes(column) || message.includes(`'${column}'`)
}

export const paymentService = {
  async getForBooking(bookingId: string): Promise<AuthResult<BookingPayments>> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('booking_id', bookingId)

    if (error) return { data: { customerAdvance: null, providerAdminFee: null }, error: error.message }

    const rows = (data as PaymentRow[]).map(mapPayment)
    return {
      data: {
        customerAdvance: rows.find((p) => p.paymentKind === 'customer_advance') ?? null,
        providerAdminFee: rows.find((p) => p.paymentKind === 'provider_admin_fee') ?? null,
      },
      error: null,
    }
  },

  async getByBookingId(
    bookingId: string,
    kind: PaymentKind = 'customer_advance',
  ): Promise<AuthResult<Payment | null>> {
    let { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('booking_id', bookingId)
      .eq('payment_kind', kind)
      .maybeSingle()

    if (error && isMissingColumnError(error.message, 'payment_kind')) {
      const fallback = await supabase.from('payments').select('*').eq('booking_id', bookingId)
      if (fallback.error) return { data: null, error: fallback.error.message }
      const rows = (fallback.data as PaymentRow[] | null)?.map(mapPayment) ?? []
      const match =
        kind === 'customer_advance'
          ? rows.find((p) => p.paymentKind === 'customer_advance') ?? rows[0]
          : rows.find((p) => p.paymentKind === 'provider_admin_fee')
      return { data: match ?? null, error: null }
    }

    if (error) return { data: null, error: error.message }
    if (!data) return { data: null, error: null }
    return { data: mapPayment(data as PaymentRow), error: null }
  },

  async submitPayment(paymentId: string, note?: string): Promise<AuthResult<Payment>> {
    const { data, error } = await supabase.rpc('customer_submit_payment', {
      p_payment_id: paymentId,
      p_note: note ?? null,
    })

    if (error) return { data: null as unknown as Payment, error: error.message }
    return { data: mapPayment(data as PaymentRow), error: null }
  },

  async submitProviderAdminFee(paymentId: string, note?: string): Promise<AuthResult<Payment>> {
    const { data, error } = await supabase.rpc('provider_submit_admin_fee', {
      p_payment_id: paymentId,
      p_note: note ?? null,
    })

    if (error) return { data: null as unknown as Payment, error: error.message }
    return { data: mapPayment(data as PaymentRow), error: null }
  },

  async listForAdmin(): Promise<AuthResult<AdminPayment[]>> {
    // Do NOT select bookings.payment_method — PostgREST errors if column missing from cache
    const { data, error } = await supabase
      .from('payments')
      .select(
        `
        *,
        bookings (
          status,
          providers ( business_name ),
          services ( name )
        )
      `,
      )
      .order('created_at', { ascending: false })

    if (error) return { data: [], error: error.message }
    if (!data?.length) return { data: [], error: null }

    const customerIds = [...new Set(data.map((row) => row.customer_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, email')
      .in('user_id', customerIds)

    const emailByUser = new Map(profiles?.map((p) => [p.user_id, p.email]) ?? [])

    return {
      data: (data as PaymentBookingJoin[]).map((row) => {
        const payment = mapPayment(row)
        return {
          ...payment,
          customerEmail: emailByUser.get(row.customer_id),
          providerName: row.bookings?.providers?.business_name,
          serviceName: row.bookings?.services?.name,
          bookingStatus: row.bookings?.status,
          bookingPaymentMethod: paymentKindToBookingMethod(payment.paymentKind),
        }
      }),
      error: null,
    }
  },

  async confirmPayment(paymentId: string): Promise<AuthResult<Payment>> {
    const { data, error } = await supabase.rpc('admin_confirm_payment', {
      p_payment_id: paymentId,
    })

    if (error) return { data: null as unknown as Payment, error: error.message }
    return { data: mapPayment(data as PaymentRow), error: null }
  },
}
