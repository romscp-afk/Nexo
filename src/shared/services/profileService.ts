import { supabase } from '@/shared/lib/supabase'
import type { AuthResult } from '@/shared/services/authService'
import { mapProfileRow, type UserProfile } from '@/shared/types/database'
import type { UpdateProfileInput } from '@/shared/types/profile'

async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

export const profileService = {
  async getMyProfile(): Promise<AuthResult<UserProfile | null>> {
    const userId = await getCurrentUserId()
    if (!userId) return { data: null, error: 'Not authenticated' }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) return { data: null, error: error.message }
    return { data: data ? mapProfileRow(data) : null, error: null }
  },

  async updateMyProfile(input: UpdateProfileInput): Promise<AuthResult<UserProfile>> {
    const userId = await getCurrentUserId()
    if (!userId) return { data: null as unknown as UserProfile, error: 'Not authenticated' }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: input.fullName,
        phone: input.phone ?? null,
        address_line1: input.addressLine1 ?? null,
        address_line2: input.addressLine2 ?? null,
        postal_code: input.postalCode ?? null,
        preferred_area: input.preferredArea ?? null,
      })
      .eq('user_id', userId)
      .select('*')
      .single()

    if (error) return { data: null as unknown as UserProfile, error: error.message }
    return { data: mapProfileRow(data), error: null }
  },
}
