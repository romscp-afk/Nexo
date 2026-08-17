import { supabase } from '@/shared/lib/supabase'
import { uploadProviderAvatarFile } from '@/shared/lib/providerAvatar'
import { normalizeSgPhone } from '@/shared/lib/phone'
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

    const phoneE164 = input.phone != null ? normalizeSgPhone(input.phone) : undefined
    if (input.phone != null && input.phone.trim() && !phoneE164) {
      return { data: null as unknown as UserProfile, error: 'Enter a valid Singapore mobile number.' }
    }

    const whatsAppE164 = input.whatsApp != null ? normalizeSgPhone(input.whatsApp) : undefined
    if (input.whatsApp != null && input.whatsApp.trim() && !whatsAppE164) {
      return { data: null as unknown as UserProfile, error: 'Enter a valid Singapore WhatsApp number.' }
    }

    const updates: Record<string, string | null> = {
      full_name: input.fullName,
      address_line1: input.addressLine1 ?? null,
      address_line2: input.addressLine2 ?? null,
      postal_code: input.postalCode ?? null,
      preferred_area: input.preferredArea ?? null,
    }

    if (input.phone !== undefined) {
      if (input.phone.trim() && !phoneE164) {
        return { data: null as unknown as UserProfile, error: 'Enter a valid Singapore mobile number.' }
      }
      updates.phone = phoneE164 ?? null
    }

    if (input.whatsApp !== undefined) {
      if (input.whatsApp.trim() && !whatsAppE164) {
        return { data: null as unknown as UserProfile, error: 'Enter a valid Singapore WhatsApp number.' }
      }
      updates.whatsapp = whatsAppE164 ?? null
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)
      .select('*')
      .single()

    if (error) return { data: null as unknown as UserProfile, error: error.message }
    return { data: mapProfileRow(data), error: null }
  },

  async uploadProviderAvatar(file: File): Promise<AuthResult<UserProfile>> {
    const userId = await getCurrentUserId()
    if (!userId) return { data: null as unknown as UserProfile, error: 'Not authenticated' }

    const avatarUrl = await uploadProviderAvatarFile(file, userId)

    const { data, error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('user_id', userId)
      .select('*')
      .single()

    if (error) return { data: null as unknown as UserProfile, error: error.message }

    // New or changed photo requires admin re-verification.
    await supabase.from('providers').update({ is_verified: false }).eq('user_id', userId)

    return { data: mapProfileRow(data), error: null }
  },
}
