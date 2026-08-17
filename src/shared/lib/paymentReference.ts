/** Matches DB function nexo_payment_reference(booking_id). */
export function bookingPaymentReference(bookingId: string): string {
  const hex = bookingId.replace(/-/g, '').slice(0, 8).toUpperCase()
  return `NEXO-${hex}`
}
