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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const { booking_id, provider_id, rating, comment } = await req.json()

    const { data: booking } = await supabase
      .from('bookings')
      .select('status, customer_id')
      .eq('id', booking_id)
      .single()

    if (!booking || booking.customer_id !== user.id) {
      throw new Error('Booking not found or not owned by customer')
    }
    if (booking.status !== 'completed') {
      throw new Error('Can only review completed bookings')
    }
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5')
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        booking_id,
        customer_id: user.id,
        provider_id,
        rating,
        comment: comment ?? null,
      })
      .select('id')
      .single()

    if (error) throw error

    return new Response(JSON.stringify({ data: { reviewId: data.id } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
