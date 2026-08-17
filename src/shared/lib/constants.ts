export const APP_NAME = 'Nexo'
export const APP_TAGLINE = 'Connecting Trust. Simplifying Life'
export const DEVELOPER_NAME = 'Uxguard'
export const DEVELOPER_URL = 'https://uxguard.studio'

/** Production site URL. Override with VITE_SITE_URL in .env */
export const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') ||
  'https://nexoservice.online'

export function getSiteUrl(): string {
  if (typeof window !== 'undefined' && window.location.origin) {
    return import.meta.env.VITE_SITE_URL?.replace(/\/$/, '') || window.location.origin
  }
  return SITE_URL
}

export const ROLES = {
  CUSTOMER: 'customer',
  PROVIDER: 'provider',
  ADMIN: 'admin',
} as const

export type UserRole = (typeof ROLES)[keyof typeof ROLES]

/** Primary admin account for portal access */
export const DEMO_ADMIN_EMAIL = 'romscp@gmail.com'
export const DEMO_ADMIN_PASSWORD = 'Test@123'

export function isAdminEmail(email: string): boolean {
  return email.trim().toLowerCase() === DEMO_ADMIN_EMAIL.toLowerCase()
}

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

/** Singapore towns and planning areas for customer location & provider coverage */
export const SINGAPORE_AREAS = [
  'Admiralty',
  'Ang Mo Kio',
  'Bedok',
  'Bishan',
  'Boon Lay',
  'Bugis',
  'Bukit Batok',
  'Bukit Merah',
  'Bukit Panjang',
  'Bukit Timah',
  'CBD',
  'Changi',
  'Chinatown',
  'Choa Chu Kang',
  'Clementi',
  'Dover',
  'East Coast',
  'Farrer Park',
  'Geylang',
  'Holland Village',
  'Hougang',
  'Jurong East',
  'Jurong West',
  'Katong',
  'Kallang',
  'Kovan',
  'Lakeside',
  'Little India',
  'Marina Bay',
  'Marine Parade',
  'Museum',
  'Newton',
  'Novena',
  'Orchard',
  'Outram',
  'Pasir Ris',
  'Paya Lebar',
  'Pioneer',
  'Potong Pasir',
  'Punggol',
  'Queenstown',
  'Redhill',
  'River Valley',
  'Rochor',
  'Seletar',
  'Sembawang',
  'Sengkang',
  'Serangoon',
  'Simei',
  'Tampines',
  'Tanah Merah',
  'Tanglin',
  'Tengah',
  'Thomson',
  'Toa Payoh',
  'Tuas',
  'Whampoa',
  'Woodlands',
  'Yishun',
] as const

export type SingaporeArea = (typeof SINGAPORE_AREAS)[number]
