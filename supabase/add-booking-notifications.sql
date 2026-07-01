-- Booking notifications for customers (and providers on new requests)
-- Run in Supabase SQL Editor after schema.sql

CREATE OR REPLACE FUNCTION notify_booking_participants()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  provider_user_id UUID;
  status_label TEXT;
BEGIN
  SELECT user_id INTO provider_user_id FROM providers WHERE id = NEW.provider_id;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO notifications (user_id, title, body, type, metadata)
    VALUES (
      NEW.customer_id,
      'Booking request sent',
      'Your booking is pending provider confirmation.',
      'booking',
      jsonb_build_object('booking_id', NEW.id, 'status', NEW.status)
    );

    IF provider_user_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, body, type, metadata)
      VALUES (
        provider_user_id,
        'New booking request',
        'A customer requested a booking. Review and confirm.',
        'booking',
        jsonb_build_object('booking_id', NEW.id, 'status', NEW.status)
      );
    END IF;
  ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
    status_label := initcap(replace(NEW.status::TEXT, '_', ' '));

    INSERT INTO notifications (user_id, title, body, type, metadata)
    VALUES (
      NEW.customer_id,
      'Booking ' || status_label,
      'Your booking is now ' || lower(status_label) || '.',
      'booking',
      jsonb_build_object('booking_id', NEW.id, 'status', NEW.status)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_notify_participants ON bookings;
CREATE TRIGGER bookings_notify_participants
  AFTER INSERT OR UPDATE OF status ON bookings
  FOR EACH ROW EXECUTE FUNCTION notify_booking_participants();

-- Notify customer when they leave a review (confirmation)
CREATE OR REPLACE FUNCTION notify_review_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, title, body, type, metadata)
  VALUES (
    NEW.customer_id,
    'Review submitted',
    'Thanks for rating your provider. Your feedback helps others book with confidence.',
    'review',
    jsonb_build_object('booking_id', NEW.booking_id, 'review_id', NEW.id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reviews_notify_customer ON reviews;
CREATE TRIGGER reviews_notify_customer
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION notify_review_created();
