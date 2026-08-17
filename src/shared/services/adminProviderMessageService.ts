import { supabase } from '@/shared/lib/supabase'
import type { AuthResult } from '@/shared/services/authService'
import {
  mapAdminProviderMessage,
  type AdminProviderMessage,
  type AdminProviderMessageRow,
} from '@/shared/types/adminProviderMessage'

async function enrichMessages(rows: AdminProviderMessageRow[]): Promise<AdminProviderMessage[]> {
  if (!rows.length) return []

  const senderIds = [...new Set(rows.map((r) => r.sender_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, full_name, role')
    .in('user_id', senderIds)

  const metaByUser = new Map(
    (profiles ?? []).map((p) => [
      p.user_id as string,
      { name: p.full_name as string, role: p.role as string },
    ]),
  )

  return rows.map((row) => {
    const meta = metaByUser.get(row.sender_id)
    return mapAdminProviderMessage(row, {
      senderName: meta?.name,
      isFromAdmin: meta?.role === 'admin',
    })
  })
}

export const adminProviderMessageService = {
  async listForProvider(providerId: string): Promise<AuthResult<AdminProviderMessage[]>> {
    const { data, error } = await supabase
      .from('admin_provider_messages')
      .select('*')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: true })

    if (error) {
      if (error.message.includes('admin_provider_messages')) {
        return { data: [], error: null }
      }
      return { data: [], error: error.message }
    }

    return { data: await enrichMessages(data as AdminProviderMessageRow[]), error: null }
  },

  async send(providerId: string, body: string): Promise<AuthResult<AdminProviderMessage>> {
    const trimmed = body.trim()
    if (!trimmed) return { data: null as unknown as AdminProviderMessage, error: 'Message is empty' }

    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    if (!userId) return { data: null as unknown as AdminProviderMessage, error: 'Not authenticated' }

    const { data, error } = await supabase
      .from('admin_provider_messages')
      .insert({
        provider_id: providerId,
        sender_id: userId,
        body: trimmed,
      })
      .select('*')
      .single()

    if (error) return { data: null as unknown as AdminProviderMessage, error: error.message }

    const enriched = await enrichMessages([data as AdminProviderMessageRow])
    return { data: enriched[0], error: null }
  },
}
