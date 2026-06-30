import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } },
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        customer_id: user.id,
        provider_id: body.provider_id,
        category_id: body.category_id,
        scheduled_at: body.scheduled_at,
        duration_hours: body.duration_hours,
        address_line1: body.address_line1,
        address_line2: body.address_line2 ?? null,
        postal_code: body.postal_code,
        notes: body.notes ?? null,
        total_price: body.total_price,
      })
      .select('id')
      .single()

    if (error) throw error

    // Notification + payment handled by DB triggers

    return new Response(JSON.stringify({ data: { bookingId: data.id } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
