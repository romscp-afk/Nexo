export type ReviewRow = {
  id: string
  booking_id: string
  customer_id: string
  provider_id: string
  rating: number
  comment: string | null
  quality_rating: number | null
  punctuality_rating: number | null
  professionalism_rating: number | null
  created_at: string
}

export type Review = {
  id: string
  bookingId: string
  customerId: string
  providerId: string
  rating: number
  comment: string | null
  qualityRating: number | null
  punctualityRating: number | null
  professionalismRating: number | null
  createdAt: string
  providerName?: string
  serviceName?: string
  customerName?: string
}

export type CreateReviewInput = {
  bookingId: string
  providerId: string
  rating: number
  comment?: string
  qualityRating?: number
  punctualityRating?: number
  professionalismRating?: number
}

export function mapReview(row: ReviewRow): Review {
  return {
    id: row.id,
    bookingId: row.booking_id,
    customerId: row.customer_id,
    providerId: row.provider_id,
    rating: row.rating,
    comment: row.comment,
    qualityRating: row.quality_rating,
    punctualityRating: row.punctuality_rating,
    professionalismRating: row.professionalism_rating,
    createdAt: row.created_at,
  }
}
