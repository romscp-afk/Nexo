import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Payload = {
  webhook_secret?: string
  recipient_user_id: string
  recipient_role: 'customer' | 'provider'
  booking_id: string
  sender_name: string
  message_body: string
  service_name?: string | null
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = (await req.json()) as Payload
    const expectedSecret = Deno.env.get('CHAT_EMAIL_WEBHOOK_SECRET')
    if (!expectedSecret || body.webhook_secret !== expectedSecret) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('user_id', body.recipient_user_id)
      .maybeSingle()

    if (profileError) throw profileError
    if (!profile?.email) {
      return json({ skipped: true, reason: 'recipient has no email' })
    }

    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) {
      return json({ skipped: true, reason: 'RESEND_API_KEY not configured' })
    }

    const siteUrl = (Deno.env.get('SITE_URL') ?? 'https://nexo-service-sepia.vercel.app').replace(/\/$/, '')
    const chatPath =
      body.recipient_role === 'provider'
        ? `/provider/bookings/${body.booking_id}#chat`
        : `/dashboard/bookings/${body.booking_id}#chat`
    const chatUrl = `${siteUrl}${chatPath}`
    const preview = body.message_body.length > 200 ? `${body.message_body.slice(0, 200)}…` : body.message_body
    const fromAddress = Deno.env.get('CHAT_EMAIL_FROM') ?? 'Nexo <onboarding@resend.dev>'

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [profile.email],
        subject: `New Nexo message from ${body.sender_name}`,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:560px;color:#0f172a">
            <h2 style="color:#3730a3">New chat message</h2>
            <p><strong>${escapeHtml(body.sender_name)}</strong> sent you a message${
              body.service_name ? ` about <strong>${escapeHtml(body.service_name)}</strong>` : ''
            }:</p>
            <blockquote style="margin:16px 0;padding:12px 16px;background:#f8fafc;border-left:4px solid #3730a3">${escapeHtml(preview)}</blockquote>
            <p><a href="${chatUrl}" style="display:inline-block;background:#3730a3;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Open chat on Nexo</a></p>
            <p style="font-size:12px;color:#64748b">You received this because you have an active Nexo booking conversation.</p>
          </div>
        `,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Resend failed (${res.status}): ${text.slice(0, 300)}`)
    }

    await supabase.rpc('log_activity', {
      p_actor_id: null,
      p_actor_role: null,
      p_action: 'chat_email_sent',
      p_entity_type: 'booking',
      p_entity_id: body.booking_id,
      p_summary: `Chat email sent to ${profile.email}`,
      p_details: { recipient_user_id: body.recipient_user_id, sender_name: body.sender_name },
    })

    return json({ ok: true, to: profile.email })
  } catch (err) {
    return json({ error: (err as Error).message }, 400)
  }
})
