import { supabase } from '@/shared/lib/supabase'

export type SendWhatsAppOtpResult = {
  verificationId: string
  phoneE164: string
  maskedPhone: string
  expiresInSeconds: number
  devOtp?: string
}

export type VerifyWhatsAppOtpResult = {
  verificationId: string
  phoneE164: string
  maskedPhone: string
  verified: true
}

async function invokeWhatsAppOtp<T>(body: Record<string, string>): Promise<{ data: T | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke('whatsapp-otp', { body })

  if (error) {
    return { data: null, error: error.message ?? 'WhatsApp verification unavailable' }
  }

  const payload = data as { error?: string } & T
  if (payload?.error) {
    return { data: null, error: payload.error }
  }

  return { data: payload as T, error: null }
}

export const whatsappVerificationService = {
  async sendCode(phone: string) {
    return invokeWhatsAppOtp<SendWhatsAppOtpResult>({ action: 'send', phone })
  },

  async verifyCode(phone: string, code: string) {
    return invokeWhatsAppOtp<VerifyWhatsAppOtpResult>({ action: 'verify', phone, code })
  },
}
