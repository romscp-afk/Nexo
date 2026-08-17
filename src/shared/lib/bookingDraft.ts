import type { BookingPaymentMethod } from '@/shared/types/booking'

export type CleaningRequestDraft = {
  version: 1
  cleaningTypeId: string
  serviceId: string
  propertyType: string
  bedrooms: number
  bathrooms: number
  supplies: 'customer' | 'cleaner'
  scheduledAt: string
  durationHours: number
  serviceArea: string
  addressLine1: string
  addressLine2: string
  postalCode: string
  notes: string
  paymentMethod: BookingPaymentMethod
  step: number
  updatedAt: string
}

const KEY = 'nexo-cleaning-request-draft'

export function saveCleaningDraft(draft: CleaningRequestDraft) {
  sessionStorage.setItem(KEY, JSON.stringify({ ...draft, updatedAt: new Date().toISOString() }))
}

export function loadCleaningDraft(): CleaningRequestDraft | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CleaningRequestDraft
    return parsed?.version === 1 ? parsed : null
  } catch {
    return null
  }
}

export function clearCleaningDraft() {
  sessionStorage.removeItem(KEY)
}
