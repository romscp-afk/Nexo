import { supabase } from '@/shared/lib/supabase'
import type { AuthResult } from '@/shared/services/authService'
import type { ProviderListing } from '@/shared/types/catalog'
import { providerService } from '@/shared/services/providerService'

export type SavedProviderRow = {
  id: string
  customer_id: string
  provider_id: string
  created_at: string
}

export const savedProviderService = {
  async list(): Promise<AuthResult<ProviderListing[]>> {
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    if (!userId) return { data: [], error: 'Not authenticated' }

    const { data, error } = await supabase
      .from('saved_providers')
      .select('provider_id')
      .eq('customer_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      if (error.message.includes('saved_providers')) {
        return { data: [], error: null }
      }
      return { data: [], error: error.message }
    }

    const ids = (data ?? []).map((row) => row.provider_id as string)
    if (!ids.length) return { data: [], error: null }

    const providers: ProviderListing[] = []
    for (const id of ids) {
      const { data: provider, error: providerError } = await providerService.getProviderById(id)
      if (!providerError && provider) providers.push(provider)
    }
    return { data: providers, error: null }
  },

  async isSaved(providerId: string): Promise<boolean> {
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    if (!userId) return false

    const { data } = await supabase
      .from('saved_providers')
      .select('id')
      .eq('customer_id', userId)
      .eq('provider_id', providerId)
      .maybeSingle()

    return Boolean(data)
  },

  async save(providerId: string): Promise<AuthResult<void>> {
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    if (!userId) return { data: undefined, error: 'Not authenticated' }

    const { error } = await supabase.from('saved_providers').insert({
      customer_id: userId,
      provider_id: providerId,
    })

    if (error && !error.message.includes('duplicate')) {
      return { data: undefined, error: error.message }
    }
    return { data: undefined, error: null }
  },

  async remove(providerId: string): Promise<AuthResult<void>> {
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    if (!userId) return { data: undefined, error: 'Not authenticated' }

    const { error } = await supabase
      .from('saved_providers')
      .delete()
      .eq('customer_id', userId)
      .eq('provider_id', providerId)

    if (error) return { data: undefined, error: error.message }
    return { data: undefined, error: null }
  },
}
