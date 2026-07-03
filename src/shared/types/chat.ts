export type BookingMessageRow = {
  id: string
  booking_id: string
  sender_id: string
  body: string
  image_url: string | null
  created_at: string
}

export type BookingMessage = {
  id: string
  bookingId: string
  senderId: string
  body: string
  imageUrl: string | null
  createdAt: string
  senderName?: string
}

export function mapBookingMessage(
  row: BookingMessageRow,
  extras?: { senderName?: string },
): BookingMessage {
  return {
    id: row.id,
    bookingId: row.booking_id,
    senderId: row.sender_id,
    body: row.body,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    senderName: extras?.senderName,
  }
}
