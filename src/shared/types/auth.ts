export type AuthUser = {
  id: string
  email: string
  role: import('@/shared/lib/constants').UserRole
  fullName?: string
}

export type SignUpInput = {
  email: string
  password: string
  role: import('@/shared/lib/constants').UserRole
  fullName: string
  phone?: string
  businessName?: string
}

export type SignInInput = {
  email: string
  password: string
}
