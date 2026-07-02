export type AuthUser = {
  id: string
  email: string
  role: import('@/shared/lib/constants').UserRole
  fullName?: string
  phone?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  postalCode?: string | null
  preferredArea?: string | null
}

export type SignUpInput = {
  email: string
  password: string
  role: import('@/shared/lib/constants').UserRole
  fullName: string
  phone?: string
  addressLine1?: string
  addressLine2?: string
  postalCode?: string
  preferredArea?: string
  businessName?: string
  bio?: string
  yearsExperience?: number
  hourlyRate?: number
  serviceAreas?: string[]
}

export type SignInInput = {
  email: string
  password: string
}
