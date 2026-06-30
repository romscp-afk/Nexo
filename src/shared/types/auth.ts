export type AuthUser = {
  id: string
  email: string
  role: import('@/shared/lib/constants').UserRole
}

export type SignUpInput = {
  email: string
  password: string
  role: import('@/shared/lib/constants').UserRole
}

export type SignInInput = {
  email: string
  password: string
}
