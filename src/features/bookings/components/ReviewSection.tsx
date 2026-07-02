import { useState } from 'react'
import { Star } from 'lucide-react'
import { useCreateReview, useReviewForBooking } from '@/features/bookings/hooks/useReviews'
import type { Booking } from '@/shared/types/booking'

export function ReviewSection({ booking }: { booking: Booking }) {
  const { data: review, isLoading } = useReviewForBooking(booking.id)
  const createReview = useCreateReview()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (booking.status !== 'completed' || !booking.providerId) return null
  if (isLoading) return null

  if (review) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">Your review</h2>
        <div className="mt-3 flex items-center gap-1 text-amber-600">
          {Array.from({ length: review.rating }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-current" />
          ))}
        </div>
        {review.comment && <p className="mt-2 text-sm text-slate-700">{review.comment}</p>}
      </section>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await createReview.mutateAsync({
        bookingId: booking.id,
        providerId: booking.providerId!,
        rating,
        comment: comment || undefined,
      })
      setSuccess('Thank you for your review!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit review')
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="font-semibold text-slate-900">Leave a review</h2>
      <p className="mt-1 text-sm text-slate-600">Share your experience with {booking.providerName}.</p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {error && <p className="text-sm text-red-700">{error}</p>}
        {success && <p className="text-sm text-green-700">{success}</p>}

        <label className="block text-sm">
          <span className="font-medium text-slate-700">Rating</span>
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="mt-1 rounded-lg border border-slate-200 px-3 py-2"
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} star{n > 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium text-slate-700">Comment (optional)</span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>

        <button
          type="submit"
          disabled={createReview.isPending || Boolean(success)}
          className="rounded-lg bg-nexo-700 px-4 py-2 text-sm font-medium text-white hover:bg-nexo-800 disabled:opacity-50"
        >
          {createReview.isPending ? 'Submitting…' : 'Submit review'}
        </button>
      </form>
    </section>
  )
}
