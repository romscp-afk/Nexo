-- Chat inbox: read receipts, unread tracking, richer message notifications

CREATE TABLE IF NOT EXISTS booking_message_reads (
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (booking_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_booking_message_reads_user ON booking_message_reads(user_id);

ALTER TABLE booking_message_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "booking_message_reads_select_own" ON booking_message_reads;
CREATE POLICY "booking_message_reads_select_own" ON booking_message_reads FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "booking_message_reads_upsert_own" ON booking_message_reads;
CREATE POLICY "booking_message_reads_upsert_own" ON booking_message_reads FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "booking_message_reads_update_own" ON booking_message_reads;
CREATE POLICY "booking_message_reads_update_own" ON booking_message_reads FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Richer chat notifications with message preview metadata
CREATE OR REPLACE FUNCTION notify_booking_message()
RETURNS TRIGGER AS $$
DECLARE
  booking_row bookings%ROWTYPE;
  recipient UUID;
  sender_name TEXT;
  service_name TEXT;
BEGIN
  SELECT * INTO booking_row FROM bookings WHERE id = NEW.booking_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  SELECT full_name INTO sender_name FROM profiles WHERE user_id = NEW.sender_id;
  SELECT s.name INTO service_name
  FROM services s
  WHERE s.id = booking_row.service_id;

  IF NEW.sender_id = booking_row.customer_id THEN
    SELECT user_id INTO recipient FROM providers WHERE id = booking_row.provider_id;
  ELSE
    recipient := booking_row.customer_id;
  END IF;

  IF recipient IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, body, type, metadata)
    VALUES (
      recipient,
      'New chat message',
      COALESCE(sender_name, 'Someone') || ': ' || LEFT(NEW.body, 120),
      'booking',
      jsonb_build_object(
        'kind', 'chat_message',
        'booking_id', NEW.booking_id,
        'message_id', NEW.id,
        'sender_id', NEW.sender_id,
        'service_name', service_name
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
