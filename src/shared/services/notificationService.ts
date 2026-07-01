import { supabase } from '@/shared/lib/supabase'
import type { AuthResult } from '@/shared/services/authService'
import { mapNotification, type Notification } from '@/shared/types/notification'

async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

export const notificationService = {
  async listMine(): Promise<AuthResult<Notification[]>> {
    const userId = await getCurrentUserId()
    if (!userId) return { data: [], error: 'Not authenticated' }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) return { data: [], error: error.message }
    return { data: data.map(mapNotification), error: null }
  },

  async markRead(id: string): Promise<AuthResult<void>> {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)

    return { data: undefined, error: error?.message ?? null }
  },

  async markAllRead(): Promise<AuthResult<void>> {
    const userId = await getCurrentUserId()
    if (!userId) return { data: undefined, error: 'Not authenticated' }

    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null)

    return { data: undefined, error: error?.message ?? null }
  },
}
