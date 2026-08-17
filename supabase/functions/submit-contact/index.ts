import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Payload = {
  full_name: string
  email: string
  phone?: string
  subject: string
  message: string
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

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = (await req.json()) as Payload
    const fullName = body.full_name?.trim() ?? ''
    const email = body.email?.trim() ?? ''
    const phone = body.phone?.trim() || null
    const subject = body.subject?.trim() ?? ''
    const message = body.message?.trim() ?? ''

    if (fullName.length < 2) return json({ error: 'Enter your full name.' }, 400)
    if (!isValidEmail(email)) return json({ error: 'Enter a valid email address.' }, 400)
    if (subject.length < 3) return json({ error: 'Enter a subject.' }, 400)
    if (message.length < 10) return json({ error: 'Message must be at least 10 characters.' }, 400)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: row, error: insertError } = await supabase
      .from('contact_messages')
      .insert({
        full_name: fullName,
        email,
        phone,
        subject,
        message,
      })
      .select('id, created_at')
      .single()

    if (insertError) throw insertError

    const resendKey = Deno.env.get('RESEND_API_KEY')
    const fromAddress = Deno.env.get('CHAT_EMAIL_FROM') ?? 'Nexo <onboarding@resend.dev>'
    const siteUrl = (Deno.env.get('SITE_URL') ?? 'https://nexoservice.online').replace(/\/$/, '')

    let emailSent = false
    let emailSkippedReason: string | null = null

    if (!resendKey) {
      emailSkippedReason = 'RESEND_API_KEY not configured'
    } else {
      const { data: admins, error: adminErr } = await supabase
        .from('profiles')
        .select('email')
        .eq('role', 'admin')
        .eq('is_active', true)

      if (adminErr) throw adminErr

      const recipients = [...new Set((admins ?? []).map((a) => a.email).filter(Boolean))]
      if (!recipients.length) {
        emailSkippedReason = 'No admin emails configured'
      } else {
        const adminUrl = `${siteUrl}/admin/contact`
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromAddress,
            to: recipients,
            reply_to: email,
            subject: `[Nexo Contact] ${subject}`,
            html: `
              <div style="font-family:system-ui,sans-serif;max-width:560px;color:#0f172a">
                <h2 style="color:#3730a3">New contact form message</h2>
                <p><strong>Name:</strong> ${escapeHtml(fullName)}</p>
                <p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
                ${phone ? `<p><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : ''}
                <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
                <blockquote style="margin:16px 0;padding:12px 16px;background:#f8fafc;border-left:4px solid #3730a3;white-space:pre-wrap">${escapeHtml(message)}</blockquote>
                <p><a href="${adminUrl}" style="display:inline-block;background:#3730a3;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">View in admin portal</a></p>
              </div>
            `,
          }),
        })

        if (!res.ok) {
          const text = await res.text()
          throw new Error(`Resend failed (${res.status}): ${text.slice(0, 300)}`)
        }

        emailSent = true
        await supabase
          .from('contact_messages')
          .update({ email_sent_at: new Date().toISOString() })
          .eq('id', row.id)
      }
    }

    await supabase.rpc('log_activity', {
      p_actor_id: null,
      p_actor_role: null,
      p_action: 'contact_form_submitted',
      p_entity_type: 'contact_message',
      p_entity_id: row.id,
      p_summary: `Contact form: ${subject}`,
      p_details: { email, email_sent: emailSent, email_skipped: emailSkippedReason },
    })

    return json({
      ok: true,
      id: row.id,
      email_sent: emailSent,
      email_skipped: emailSkippedReason,
    })
  } catch (err) {
    return json({ error: (err as Error).message }, 400)
  }
})
