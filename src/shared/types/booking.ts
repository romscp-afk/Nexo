export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export type BookingRow = {
  id: string
  customer_id: string
  provider_id: string
  service_id: string
  status: BookingStatus
  scheduled_at: string
  duration_hours: number
  address_line1: string
  address_line2: string | null
  postal_code: string
  notes: string | null
  total_price: number | null
  created_at: string
  updated_at: string
}

export type Booking = {
  id: string
  customerId: string
  providerId: string
  serviceId: string
  status: BookingStatus
  scheduledAt: string
  durationHours: number
  addressLine1: string
  addressLine2: string | null
  postalCode: string
  notes: string | null
  totalPrice: number | null
  createdAt: string
  updatedAt: string
  providerName?: string
  serviceName?: string
}

export type CreateBookingInput = {
  providerId: string
  serviceId: string
  scheduledAt: string
  durationHours: number
  addressLine1: string
  addressLine2?: string
  postalCode: string
  notes?: string
  totalPrice: number
}

export function mapBooking(
  row: BookingRow,
  extras?: { providerName?: string; serviceName?: string },
): Booking {
  return {
    id: row.id,
    customerId: row.customer_id,
    providerId: row.provider_id,
    serviceId: row.service_id,
    status: row.status,
    scheduledAt: row.scheduled_at,
    durationHours: Number(row.duration_hours),
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    postalCode: row.postal_code,
    notes: row.notes,
    totalPrice: row.total_price != null ? Number(row.total_price) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    providerName: extras?.providerName,
    serviceName: extras?.serviceName,
  }
}
