import type { UserRole } from '@/shared/lib/constants'

export type ProfileRow = {
  id: string
  user_id: string
  email: string
  full_name: string
  phone: string | null
  address_line1: string | null
  address_line2: string | null
  postal_code: string | null
  preferred_area: string | null
  avatar_url: string | null
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export type UserProfile = {
  id: string
  userId: string
  email: string
  fullName: string
  phone: string | null
  addressLine1: string | null
  addressLine2: string | null
  postalCode: string | null
  preferredArea: string | null
  avatarUrl: string | null
  role: UserRole
  isActive: boolean
}

export function mapProfileRow(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    postalCode: row.postal_code,
    preferredArea: row.preferred_area,
    avatarUrl: row.avatar_url,
    role: row.role,
    isActive: row.is_active,
  }
}
