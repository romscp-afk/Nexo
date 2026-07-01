import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/shared/lib/supabase'
import { parseRole, type UserRole } from '@/shared/lib/constants'
import { mapProfileRow, type UserProfile } from '@/shared/types/database'
import type { SignUpInput } from '@/shared/types/auth'
import { formatAuthError } from '@/shared/lib/authErrors'

export type AuthResult<T = void> = {
  data: T
  error: string | null
}

function isMissingProfilesTable(error: string | null | undefined): boolean {
  if (!error) return false
  return (
    error.includes("Could not find the table 'public.profiles'") ||
    error.includes('relation "public.profiles" does not exist') ||
    error.includes('PGRST205')
  )
}

function mapAuthUser(user: User, profile: UserProfile | null) {
  return {
    id: user.id,
    email: user.email ?? profile?.email ?? '',
    role: profile?.role ?? parseRole(user.user_metadata?.role),
    fullName: profile?.fullName,
    phone: profile?.phone ?? user.user_metadata?.phone ?? null,
    addressLine1: profile?.addressLine1 ?? user.user_metadata?.address_line1 ?? null,
    addressLine2: profile?.addressLine2 ?? user.user_metadata?.address_line2 ?? null,
    postalCode: profile?.postalCode ?? user.user_metadata?.postal_code ?? null,
    preferredArea: profile?.preferredArea ?? user.user_metadata?.preferred_area ?? null,
  }
}

export const authService = {
  async signUp(input: SignUpInput): Promise<AuthResult<{ needsEmailConfirmation: boolean }>> {
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          role: input.role,
          full_name: input.fullName,
          phone: input.phone ?? null,
          address_line1: input.addressLine1 ?? null,
          address_line2: input.addressLine2 ?? null,
          postal_code: input.postalCode ?? null,
          preferred_area: input.preferredArea ?? null,
          business_name: input.businessName ?? null,
          bio: input.bio ?? null,
          years_experience: input.yearsExperience != null ? String(input.yearsExperience) : null,
          hourly_rate: input.hourlyRate != null ? String(input.hourlyRate) : null,
          service_areas: input.serviceAreas?.length ? input.serviceAreas.join(',') : null,
        },
      },
    })

    if (error) {
      return { data: { needsEmailConfirmation: false }, error: formatAuthError(error) }
    }

    const needsEmailConfirmation = !data.session && Boolean(data.user)
    return { data: { needsEmailConfirmation }, error: null }
  },

  async signIn(
    email: string,
    password: string,
  ): Promise<AuthResult<{ user: User; role: UserRole } | null>> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return { data: null, error: formatAuthError(error) }
    }

    if (!data.user) {
      return { data: null, error: 'Sign in failed' }
    }

    const profileResult = await authService.getUserProfile(data.user.id)
    const role = profileResult.data?.role ?? parseRole(data.user.user_metadata?.role)

    return {
      data: { user: data.user, role },
      error: null,
    }
  },

  async signOut(): Promise<AuthResult> {
    const { error } = await supabase.auth.signOut()
    return { data: undefined, error: error?.message ?? null }
  },

  async getCurrentUser(): Promise<AuthResult<{ user: User; session: Session } | null>> {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      return { data: null, error: formatAuthError(error) }
    }

    if (!data.session?.user) {
      return { data: null, error: null }
    }

    return {
      data: { user: data.session.user, session: data.session },
      error: null,
    }
  },

  async getUserProfile(userId: string): Promise<AuthResult<UserProfile | null>> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      if (isMissingProfilesTable(error.message)) {
        return { data: null, error: null }
      }
      return { data: null, error: error.message }
    }

    return {
      data: data ? mapProfileRow(data) : null,
      error: null,
    }
  },

  async resolveAuthUser(user: User): Promise<AuthResult<ReturnType<typeof mapAuthUser>>> {
    const profileResult = await authService.getUserProfile(user.id)

    if (profileResult.error && !isMissingProfilesTable(profileResult.error)) {
      return { data: mapAuthUser(user, null), error: profileResult.error }
    }

    return {
      data: mapAuthUser(user, profileResult.data),
      error: null,
    }
  },

  onAuthStateChange(callback: (session: Session | null) => void) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session)
    })
    return data.subscription
  },
}
