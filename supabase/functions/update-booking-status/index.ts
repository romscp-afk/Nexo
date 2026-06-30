import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
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

    const { bookingId, status } = await req.json()

    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('status')
      .eq('id', bookingId)
      .single()

    if (fetchError || !booking) throw new Error('Booking not found')

    const allowed = VALID_TRANSITIONS[booking.status as string] ?? []
    if (!allowed.includes(status)) {
      throw new Error(`Invalid transition: ${booking.status} → ${status}`)
    }

    const { error } = await supabase.from('bookings').update({ status }).eq('id', bookingId)
    if (error) throw error

    return new Response(JSON.stringify({ data: { ok: true } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
