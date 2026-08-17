import { supabase } from '@/shared/lib/supabase'
import type { AuthResult } from '@/shared/services/authService'
import {
  mapContactMessage,
  type ContactMessage,
  type ContactMessageRow,
  type SubmitContactInput,
} from '@/shared/types/contactMessage'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export const supportContactService = {
  async submit(input: SubmitContactInput): Promise<AuthResult<{ id: string; emailSent: boolean }>> {
    const fullName = input.fullName.trim()
    const email = input.email.trim()
    const phone = input.phone?.trim() || undefined
    const subject = input.subject.trim()
    const message = input.message.trim()

    if (fullName.length < 2) return { data: null as never, error: 'Enter your full name.' }
    if (!isValidEmail(email)) return { data: null as never, error: 'Enter a valid email address.' }
    if (subject.length < 3) return { data: null as never, error: 'Enter a subject.' }
    if (message.length < 10) return { data: null as never, error: 'Message must be at least 10 characters.' }

    const { data, error } = await supabase.functions.invoke('submit-contact', {
      body: {
        full_name: fullName,
        email,
        phone,
        subject,
        message,
      },
    })

    if (error) {
      const msg = error.message ?? 'Unable to send message'
      if (/failed to send a request to the edge function|not found|404/i.test(msg)) {
        return {
          data: null as never,
          error: 'Contact service is not available yet. Please email us directly or try again later.',
        }
      }
      return { data: null as never, error: msg }
    }

    const payload = data as { error?: string; ok?: boolean; id?: string; email_sent?: boolean }
    if (payload?.error) return { data: null as never, error: payload.error }
    if (!payload?.ok || !payload.id) return { data: null as never, error: 'Unable to send message.' }

    return {
      data: { id: payload.id, emailSent: Boolean(payload.email_sent) },
      error: null,
    }
  },

  async listForAdmin(): Promise<AuthResult<ContactMessage[]>> {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return { data: null as never, error: error.message }
    return {
      data: (data as ContactMessageRow[]).map(mapContactMessage),
      error: null,
    }
  },
}
