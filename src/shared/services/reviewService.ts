import { supabase } from '@/shared/lib/supabase'
import { formatReviewerName } from '@/shared/lib/reviewUtils'
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

type ReviewJoinRow = ReviewRow & {
  providers?: { business_name: string } | null
  bookings?: { services?: { name: string } | null } | null
}

function mapReviewJoin(row: ReviewJoinRow): Review {
  return {
    ...mapReview(row),
    providerName: row.providers?.business_name ?? undefined,
    serviceName: row.bookings?.services?.name ?? undefined,
  }
}

async function attachCustomerNames(reviews: Review[]): Promise<Review[]> {
  if (reviews.length === 0) return reviews

  const customerIds = [...new Set(reviews.map((review) => review.customerId))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, full_name')
    .in('user_id', customerIds)

  const nameByUserId = new Map(
    (profiles ?? []).map((profile) => [profile.user_id as string, profile.full_name as string]),
  )

  return reviews.map((review) => ({
    ...review,
    customerName: formatReviewerName(nameByUserId.get(review.customerId)),
  }))
}

async function fetchPublicReviews(
  filter?: { providerId?: string; limit?: number },
): Promise<AuthResult<Review[]>> {
  let query = supabase
    .from('reviews')
    .select(
      `
      *,
      providers ( business_name ),
      bookings ( services ( name ) )
    `,
    )
    .order('created_at', { ascending: false })

  if (filter?.providerId) {
    query = query.eq('provider_id', filter.providerId)
  }
  if (filter?.limit) {
    query = query.limit(filter.limit)
  }

  const { data, error } = await query
  if (error) return { data: [], error: error.message }

  const reviews = (data as ReviewJoinRow[]).map(mapReviewJoin)
  return { data: await attachCustomerNames(reviews), error: null }
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
    return fetchPublicReviews({ providerId })
  },

  async listRecentPublic(limit = 6): Promise<AuthResult<Review[]>> {
    return fetchPublicReviews({ limit })
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

    return {
      data: (data as ReviewJoinRow[]).map(mapReviewJoin),
      error: null,
    }
  },
}
