-- Booking chat: open after provider assigned + payment confirmed;
-- stay active 6 hours after job marked completed.

CREATE OR REPLACE FUNCTION booking_chat_can_send(p_booking_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  b bookings%ROWTYPE;
  completed_at TIMESTAMPTZ;
BEGIN
  SELECT * INTO b FROM bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF b.provider_id IS NULL OR b.status = 'cancelled' THEN
    RETURN FALSE;
  END IF;

  IF COALESCE(b.payment_method::text, 'paynow') = 'cash' THEN
    IF NOT COALESCE(b.customer_contact_shared, FALSE) THEN
      RETURN FALSE;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM payments p
      WHERE p.booking_id = b.id
        AND p.payment_kind = 'provider_admin_fee'
        AND p.status = 'paid'
    ) THEN
      RETURN FALSE;
    END IF;
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM payments p
      WHERE p.booking_id = b.id
        AND p.payment_kind = 'customer_advance'
        AND p.status = 'paid'
    ) THEN
      RETURN FALSE;
    END IF;
  END IF;

  IF b.status IN ('confirmed', 'in_progress') THEN
    RETURN TRUE;
  END IF;

  IF b.status = 'completed' THEN
    SELECT h.created_at INTO completed_at
    FROM booking_status_history h
    WHERE h.booking_id = b.id AND h.new_status = 'completed'
    ORDER BY h.created_at DESC
    LIMIT 1;

    IF completed_at IS NULL THEN
      completed_at := b.updated_at;
    END IF;

    RETURN now() <= completed_at + INTERVAL '6 hours';
  END IF;

  RETURN FALSE;
END;
$$;

DROP POLICY IF EXISTS "booking_messages_insert_participant" ON booking_messages;
CREATE POLICY "booking_messages_insert_participant" ON booking_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id
        AND (
          b.customer_id = auth.uid()
          OR b.provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid())
        )
    )
    AND booking_chat_can_send(booking_id)
  );
