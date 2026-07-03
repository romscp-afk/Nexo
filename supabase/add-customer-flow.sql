-- Customer flow: saved providers, booking chat, review dimensions, booking photos

-- Review sub-ratings
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS quality_rating INT CHECK (quality_rating IS NULL OR quality_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS punctuality_rating INT CHECK (punctuality_rating IS NULL OR punctuality_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS professionalism_rating INT CHECK (professionalism_rating IS NULL OR professionalism_rating BETWEEN 1 AND 5);

-- Optional job photos on bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS photo_urls TEXT[] NOT NULL DEFAULT '{}';

-- Saved / favourite providers
CREATE TABLE IF NOT EXISTS saved_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (customer_id, provider_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_providers_customer ON saved_providers(customer_id);

ALTER TABLE saved_providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_providers_select_own" ON saved_providers;
CREATE POLICY "saved_providers_select_own" ON saved_providers FOR SELECT
  USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "saved_providers_insert_own" ON saved_providers;
CREATE POLICY "saved_providers_insert_own" ON saved_providers FOR INSERT
  WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "saved_providers_delete_own" ON saved_providers;
CREATE POLICY "saved_providers_delete_own" ON saved_providers FOR DELETE
  USING (customer_id = auth.uid());

-- In-app chat per booking
CREATE TABLE IF NOT EXISTS booking_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_messages_booking ON booking_messages(booking_id, created_at);

ALTER TABLE booking_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "booking_messages_select_participant" ON booking_messages;
CREATE POLICY "booking_messages_select_participant" ON booking_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id
        AND (
          b.customer_id = auth.uid()
          OR b.provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS "booking_messages_insert_participant" ON booking_messages;
CREATE POLICY "booking_messages_insert_participant" ON booking_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id
        AND b.status NOT IN ('cancelled', 'completed')
        AND (
          b.customer_id = auth.uid()
          OR b.provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid())
        )
    )
  );

-- Notify recipient on new chat message
CREATE OR REPLACE FUNCTION notify_booking_message()
RETURNS TRIGGER AS $$
DECLARE
  booking_row bookings%ROWTYPE;
  recipient UUID;
  sender_name TEXT;
BEGIN
  SELECT * INTO booking_row FROM bookings WHERE id = NEW.booking_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  SELECT full_name INTO sender_name FROM profiles WHERE user_id = NEW.sender_id;

  IF NEW.sender_id = booking_row.customer_id THEN
    SELECT user_id INTO recipient FROM providers WHERE id = booking_row.provider_id;
  ELSE
    recipient := booking_row.customer_id;
  END IF;

  IF recipient IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, body, type, metadata)
    VALUES (
      recipient,
      'New message',
      COALESCE(sender_name, 'Someone') || ' sent a message about your booking.',
      'booking',
      jsonb_build_object('booking_id', NEW.booking_id, 'message_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS booking_messages_notify ON booking_messages;
CREATE TRIGGER booking_messages_notify
  AFTER INSERT ON booking_messages
  FOR EACH ROW EXECUTE FUNCTION notify_booking_message();

-- Storage bucket for booking photos (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('booking-photos', 'booking-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "booking_photos_upload" ON storage.objects;
CREATE POLICY "booking_photos_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'booking-photos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "booking_photos_read" ON storage.objects;
CREATE POLICY "booking_photos_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'booking-photos');
