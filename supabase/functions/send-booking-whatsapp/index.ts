import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Payload = {
  webhook_secret?: string
  recipient_user_id: string
  message: string
  booking_id?: string | null
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function normalizeSgPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (/^[689]\d{7}$/.test(digits)) return `+65${digits}`
  if (/^65[689]\d{7}$/.test(digits)) return `+${digits}`
  if (/^\+65[689]\d{7}$/.test(raw.trim())) return raw.trim()
  return null
}

async function sendTwilioWhatsApp(toE164: string, body: string): Promise<void> {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
  const from = Deno.env.get('TWILIO_WHATSAPP_FROM')

  if (!accountSid || !authToken || !from) {
    throw new Error('Twilio not configured')
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
  const params = new URLSearchParams({
    From: from.startsWith('whatsapp:') ? from : `whatsapp:${from}`,
    To: toE164.startsWith('whatsapp:') ? toE164 : `whatsapp:${toE164}`,
    Body: body,
  })

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Twilio failed (${res.status}): ${text.slice(0, 300)}`)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = (await req.json()) as Payload
    const expectedSecret = Deno.env.get('BOOKING_WHATSAPP_WEBHOOK_SECRET')
    if (!expectedSecret || body.webhook_secret !== expectedSecret) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('phone, full_name')
      .eq('user_id', body.recipient_user_id)
      .maybeSingle()

    if (profileError) throw profileError
    if (!profile?.phone) {
      return json({ skipped: true, reason: 'recipient has no phone' })
    }

    const e164 = normalizeSgPhone(profile.phone)
    if (!e164) {
      return json({ skipped: true, reason: 'invalid phone format' })
    }

    const siteUrl = (Deno.env.get('SITE_URL') ?? 'https://nexo-service-sepia.vercel.app').replace(/\/$/, '')
    const message = body.message.includes(siteUrl)
      ? body.message
      : `${body.message}\n\n${siteUrl}/dashboard/bookings`

    await sendTwilioWhatsApp(e164, message)

    await supabase.rpc('log_activity', {
      p_actor_id: null,
      p_actor_role: null,
      p_action: 'booking_whatsapp_sent',
      p_entity_type: 'booking',
      p_entity_id: body.booking_id ?? null,
      p_summary: `WhatsApp sent to ${e164}`,
      p_details: { recipient_user_id: body.recipient_user_id },
    })

    return json({ ok: true, to: e164 })
  } catch (err) {
    const msg = (err as Error).message
    if (msg.includes('Twilio not configured')) {
      return json({ skipped: true, reason: msg })
    }
    return json({ error: msg }, 400)
  }
})
