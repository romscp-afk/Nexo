import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const OTP_TTL_MINUTES = 10
const RESEND_COOLDOWN_SECONDS = 60
const MAX_ATTEMPTS = 5

type Action = 'send' | 'verify'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

/** Normalize Singapore mobile to E.164 (+65XXXXXXXX) */
function normalizeSgPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (/^[689]\d{7}$/.test(digits)) return `+65${digits}`
  if (/^65[689]\d{7}$/.test(digits)) return `+${digits}`
  if (/^\+65[689]\d{7}$/.test(raw.trim())) return raw.trim()
  return null
}

function maskPhone(e164: string): string {
  if (e164.length < 8) return e164
  return `${e164.slice(0, 4)} **** ${e164.slice(-4)}`
}

function generateOtp(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0]! % 1_000_000
  return n.toString().padStart(6, '0')
}

async function hashOtp(otp: string, phone: string): Promise<string> {
  const pepper = Deno.env.get('WHATSAPP_OTP_PEPPER') ?? 'nexo-dev-pepper'
  const data = new TextEncoder().encode(`${phone}:${otp}:${pepper}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function sendTwilioWhatsApp(toE164: string, body: string): Promise<void> {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
  const from = Deno.env.get('TWILIO_WHATSAPP_FROM')

  if (!accountSid || !authToken || !from) {
    throw new Error('WhatsApp is not configured on the server (Twilio env vars missing)')
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
  const params = new URLSearchParams({
    From: from.startsWith('whatsapp:') ? from : `whatsapp:${from}`,
    To: toE164.startsWith('whatsapp:') ? toE164 : `whatsapp:${toE164}`,
    Body: body,
  })

  const auth = btoa(`${accountSid}:${authToken}`)
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Twilio WhatsApp failed: ${text.slice(0, 200)}`)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const body = await req.json() as { action?: Action; phone?: string; code?: string }
    const action = body.action
    const phoneE164 = body.phone ? normalizeSgPhone(body.phone) : null

    if (!action || !phoneE164) {
      return json({ error: 'Invalid phone number. Use a Singapore mobile (e.g. 91234567).' }, 400)
    }

    if (action === 'send') {
      const { data: recent } = await supabase
        .from('phone_verifications')
        .select('sent_at')
        .eq('phone_e164', phoneE164)
        .is('verified_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (recent?.sent_at) {
        const sentAt = new Date(recent.sent_at).getTime()
        const elapsed = (Date.now() - sentAt) / 1000
        if (elapsed < RESEND_COOLDOWN_SECONDS) {
          return json(
            {
              error: `Please wait ${Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed)}s before requesting another code.`,
            },
            429,
          )
        }
      }

      const otp = generateOtp()
      const otpHash = await hashOtp(otp, phoneE164)
      const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString()

      const { data: row, error: insertError } = await supabase
        .from('phone_verifications')
        .insert({
          phone_e164: phoneE164,
          otp_hash: otpHash,
          expires_at: expiresAt,
          max_attempts: MAX_ATTEMPTS,
        })
        .select('id')
        .single()

      if (insertError) throw insertError

      const message = `Your Nexo verification code is ${otp}. It expires in ${OTP_TTL_MINUTES} minutes. Do not share this code.`
      const devMode = Deno.env.get('WHATSAPP_OTP_DEV') === 'true'

      if (devMode) {
        console.log(`[whatsapp-otp dev] ${phoneE164} → ${otp}`)
      } else {
        await sendTwilioWhatsApp(phoneE164, message)
      }

      return json({
        verificationId: row.id,
        phoneE164,
        maskedPhone: maskPhone(phoneE164),
        expiresInSeconds: OTP_TTL_MINUTES * 60,
        ...(devMode ? { devOtp: otp } : {}),
      })
    }

    if (action === 'verify') {
      const code = (body.code ?? '').trim()
      if (!/^\d{6}$/.test(code)) {
        return json({ error: 'Enter the 6-digit code from WhatsApp.' }, 400)
      }

      const { data: row, error: fetchError } = await supabase
        .from('phone_verifications')
        .select('*')
        .eq('phone_e164', phoneE164)
        .is('verified_at', null)
        .is('consumed_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (fetchError) throw fetchError
      if (!row) {
        return json({ error: 'No active verification code. Request a new WhatsApp code.' }, 400)
      }

      if (row.attempts >= row.max_attempts) {
        return json({ error: 'Too many attempts. Request a new WhatsApp code.' }, 429)
      }

      const expectedHash = await hashOtp(code, phoneE164)
      const valid = expectedHash === row.otp_hash

      if (!valid) {
        await supabase
          .from('phone_verifications')
          .update({ attempts: row.attempts + 1 })
          .eq('id', row.id)
        return json({ error: 'Incorrect code. Check WhatsApp and try again.' }, 400)
      }

      const { error: updateError } = await supabase
        .from('phone_verifications')
        .update({ verified_at: new Date().toISOString() })
        .eq('id', row.id)

      if (updateError) throw updateError

      return json({
        verificationId: row.id,
        phoneE164,
        maskedPhone: maskPhone(phoneE164),
        verified: true,
      })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (err) {
    console.error('[whatsapp-otp]', err)
    return json({ error: (err as Error).message ?? 'Verification failed' }, 400)
  }
})
