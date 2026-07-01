import type { UserProfile } from '@/shared/types/database'

export type UpdateProfileInput = {
  fullName: string
  phone?: string
  addressLine1?: string
  addressLine2?: string
  postalCode?: string
  preferredArea?: string
}

export type { UserProfile }
