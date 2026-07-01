import { supabase } from '@/shared/lib/supabase'
import type { AuthResult } from '@/shared/services/authService'
import {
  mapReview,
  type CreateReviewInput,
  type Review,
  type ReviewRow,
} from '@/shared/types/review'

async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

export const reviewService = {
  async getForBooking(bookingId: string): Promise<AuthResult<Review | null>> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('booking_id', bookingId)
      .maybeSingle()

    if (error) return { data: null, error: error.message }
    return { data: data ? mapReview(data as ReviewRow) : null, error: null }
  },

  async create(input: CreateReviewInput): Promise<AuthResult<Review>> {
    const userId = await getCurrentUserId()
    if (!userId) return { data: null as unknown as Review, error: 'Not authenticated' }

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        booking_id: input.bookingId,
        customer_id: userId,
        provider_id: input.providerId,
        rating: input.rating,
        comment: input.comment ?? null,
      })
      .select('*')
      .single()

    if (error) return { data: null as unknown as Review, error: error.message }
    return { data: mapReview(data as ReviewRow), error: null }
  },

  async listForProvider(providerId: string): Promise<AuthResult<Review[]>> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false })

    if (error) return { data: [], error: error.message }
    return { data: (data as ReviewRow[]).map(mapReview), error: null }
  },

  async listForCustomer(): Promise<AuthResult<Review[]>> {
    const userId = await getCurrentUserId()
    if (!userId) return { data: [], error: 'Not authenticated' }

    const { data, error } = await supabase
      .from('reviews')
      .select(
        `
        *,
        providers ( business_name ),
        bookings ( services ( name ) )
      `,
      )
      .eq('customer_id', userId)
      .order('created_at', { ascending: false })

    if (error) return { data: [], error: error.message }

    type ReviewJoin = ReviewRow & {
      providers: { business_name: string } | null
      bookings: { services: { name: string } | null } | null
    }

    return {
      data: (data as ReviewJoin[]).map((row) => ({
        ...mapReview(row),
        providerName: row.providers?.business_name,
        serviceName: row.bookings?.services?.name,
      })),
      error: null,
    }
  },
}
