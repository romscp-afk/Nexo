import { useState } from 'react'
import { Star } from 'lucide-react'
import { useCreateReview, useReviewForBooking } from '@/features/bookings/hooks/useReviews'
import type { Booking } from '@/shared/types/booking'

function StarRating({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (n: number) => void
}) {
  return (
    <div>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="rounded p-0.5"
            aria-label={`${n} stars`}
          >
            <Star
              className={`h-5 w-5 ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export function ReviewSection({ booking }: { booking: Booking }) {
  const { data: review, isLoading } = useReviewForBooking(booking.id)
  const createReview = useCreateReview()
  const [rating, setRating] = useState(5)
  const [qualityRating, setQualityRating] = useState(5)
  const [punctualityRating, setPunctualityRating] = useState(5)
  const [professionalismRating, setProfessionalismRating] = useState(5)
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
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
          {review.qualityRating != null && (
            <div>
              <dt className="text-slate-500">Service quality</dt>
              <dd className="font-medium">{review.qualityRating}/5</dd>
            </div>
          )}
          {review.punctualityRating != null && (
            <div>
              <dt className="text-slate-500">Punctuality</dt>
              <dd className="font-medium">{review.punctualityRating}/5</dd>
            </div>
          )}
          {review.professionalismRating != null && (
            <div>
              <dt className="text-slate-500">Professionalism</dt>
              <dd className="font-medium">{review.professionalismRating}/5</dd>
            </div>
          )}
        </dl>
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
        qualityRating,
        punctualityRating,
        professionalismRating,
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

        <StarRating label="Overall rating" value={rating} onChange={setRating} />
        <div className="grid gap-4 sm:grid-cols-3">
          <StarRating label="Service quality" value={qualityRating} onChange={setQualityRating} />
          <StarRating label="Punctuality" value={punctualityRating} onChange={setPunctualityRating} />
          <StarRating
            label="Professionalism"
            value={professionalismRating}
            onChange={setProfessionalismRating}
          />
        </div>

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
