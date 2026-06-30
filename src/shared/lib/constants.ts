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
