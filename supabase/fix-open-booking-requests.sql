-- Open cleaning requests: customer submits without a provider assigned.
-- Safe to re-run.

ALTER TABLE bookings ALTER COLUMN provider_id DROP NOT NULL;

-- Notify providers when an open request is created (provider_id IS NULL)
CREATE OR REPLACE FUNCTION notify_category_providers_on_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  service_name TEXT;
  category_name TEXT;
  pay_label TEXT;
BEGIN
  IF TG_OP <> 'INSERT' THEN RETURN NEW; END IF;

  SELECT s.name, sc.name INTO service_name, category_name
  FROM services s
  JOIN service_categories sc ON sc.id = s.category_id
  WHERE s.id = NEW.service_id;

  pay_label := CASE NEW.payment_method WHEN 'cash' THEN 'CASH' ELSE 'PayNow' END;

  IF NEW.provider_id IS NULL THEN
    INSERT INTO notifications (user_id, title, body, type, metadata)
    SELECT DISTINCT p.user_id,
      'New ' || category_name || ' request',
      service_name || ' · ' || pay_label || ' · ' || to_char(NEW.scheduled_at, 'DD Mon YYYY HH24:MI'),
      'booking'::notification_type,
      jsonb_build_object(
        'booking_id', NEW.id,
        'service_id', NEW.service_id,
        'payment_method', NEW.payment_method,
        'open_request', true
      )
    FROM provider_services ps
    JOIN providers pr ON pr.id = ps.provider_id AND pr.is_active = true
    JOIN profiles p ON p.user_id = pr.user_id
    WHERE ps.service_id = NEW.service_id;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_activity') THEN
      PERFORM log_activity(
        NEW.customer_id, 'customer', 'service_request_created', 'booking', NEW.id,
        category_name || ' request broadcast to providers (' || pay_label || ')',
        jsonb_build_object('booking_id', NEW.id, 'service_id', NEW.service_id, 'payment_method', NEW.payment_method)
      );
    END IF;
  ELSE
    INSERT INTO notifications (user_id, title, body, type, metadata)
    SELECT pr.user_id, 'New booking request', service_name || ' · ' || pay_label,
      'booking'::notification_type, jsonb_build_object('booking_id', NEW.id, 'status', NEW.status)
    FROM providers pr WHERE pr.id = NEW.provider_id;
  END IF;

  INSERT INTO notifications (user_id, title, body, type, metadata)
  VALUES (
    NEW.customer_id,
    'Request submitted',
    'Your ' || COALESCE(category_name, 'service') || ' request was sent to available providers.',
    'booking'::notification_type,
    jsonb_build_object('booking_id', NEW.id, 'payment_method', NEW.payment_method)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_notify_participants ON bookings;
DROP TRIGGER IF EXISTS bookings_notify_category_request ON bookings;
CREATE TRIGGER bookings_notify_category_request
  AFTER INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION notify_category_providers_on_request();

-- Provider claims an open request
CREATE OR REPLACE FUNCTION provider_accept_booking(p_booking_id UUID)
RETURNS bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row bookings;
  provider_row providers;
BEGIN
  SELECT * INTO provider_row FROM providers WHERE user_id = auth.uid();
  IF provider_row.id IS NULL THEN RAISE EXCEPTION 'Provider profile not found'; END IF;

  SELECT * INTO row FROM bookings
  WHERE id = p_booking_id AND provider_id IS NULL AND status = 'pending'
  FOR UPDATE;

  IF row.id IS NULL THEN RAISE EXCEPTION 'Open request not available'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM provider_services WHERE provider_id = provider_row.id AND service_id = row.service_id
  ) THEN RAISE EXCEPTION 'You do not offer this service'; END IF;

  UPDATE bookings
  SET provider_id = provider_row.id, status = 'confirmed', updated_at = now()
  WHERE id = p_booking_id
  RETURNING * INTO row;

  INSERT INTO notifications (user_id, title, body, type, metadata)
  VALUES (
    row.customer_id,
    'Booking confirmed',
    provider_row.business_name || ' accepted your request. ' ||
      CASE row.payment_method
        WHEN 'paynow' THEN 'Please complete PayNow payment to proceed.'
        ELSE 'Pay the platform fee via PayNow, then pay the provider in cash on completion.'
      END,
    'booking'::notification_type,
    jsonb_build_object('booking_id', row.id, 'payment_method', row.payment_method)
  );

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_activity') THEN
    PERFORM log_activity(
      auth.uid(), 'provider', 'booking_accepted', 'booking', row.id,
      provider_row.business_name || ' accepted open request',
      jsonb_build_object('booking_id', row.id, 'payment_method', row.payment_method)
    );
  END IF;

  RETURN row;
END;
$$;

GRANT EXECUTE ON FUNCTION provider_accept_booking(UUID) TO authenticated;

DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION
  WHEN others THEN NULL;
END $$;
