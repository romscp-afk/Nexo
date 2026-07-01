export const APP_NAME = 'Nexo'

export const ROLES = {
  CUSTOMER: 'customer',
  PROVIDER: 'provider',
  ADMIN: 'admin',
} as const

export type UserRole = (typeof ROLES)[keyof typeof ROLES]

export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'provider':
      return '/provider'
    default:
      return '/dashboard'
  }
}

export function parseRole(value: unknown): UserRole {
  if (value === 'admin' || value === 'provider' || value === 'customer') return value
  return 'customer'
}

/** Common Singapore areas for customer preferred location & provider coverage */
export const SINGAPORE_AREAS = [
  'Ang Mo Kio',
  'Bedok',
  'Bishan',
  'Bukit Batok',
  'CBD',
  'Clementi',
  'Jurong East',
  'Pasir Ris',
  'Simei',
  'Tampines',
  'Toa Payoh',
  'Woodlands',
  'Yishun',
] as const

export type SingaporeArea = (typeof SINGAPORE_AREAS)[number]
