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

export type ChatThread = {
  bookingId: string
  counterpartName: string
  serviceName: string | null
  bookingStatus: string
  lastMessageBody: string | null
  lastMessageAt: string | null
  lastSenderId: string | null
  unreadCount: number
  chatState: 'locked' | 'active' | 'read_only'
}

export type BookingMessageReadRow = {
  booking_id: string
  user_id: string
  last_read_at: string
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
