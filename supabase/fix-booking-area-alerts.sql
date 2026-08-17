-- Booking service area alerts: notify providers registered for the job location.
-- Safe to re-run.

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_area TEXT;

CREATE OR REPLACE FUNCTION normalize_area_label(p_area TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(lower(trim(p_area)), '');
$$;

CREATE OR REPLACE FUNCTION provider_covers_area(p_service_areas TEXT[], p_booking_area TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  booking_norm TEXT := normalize_area_label(p_booking_area);
  area_item TEXT;
  area_norm TEXT;
BEGIN
  IF booking_norm IS NULL THEN
    RETURN TRUE;
  END IF;

  IF p_service_areas IS NULL OR array_length(p_service_areas, 1) IS NULL THEN
    RETURN FALSE;
  END IF;

  FOREACH area_item IN ARRAY p_service_areas LOOP
    area_norm := normalize_area_label(area_item);
    IF area_norm IS NULL THEN
      CONTINUE;
    END IF;
    IF area_norm = booking_norm OR area_norm LIKE '%' || booking_norm || '%' OR booking_norm LIKE '%' || area_norm || '%' THEN
      RETURN TRUE;
    END IF;
  END LOOP;

  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION booking_target_area(p_booking bookings)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  parsed TEXT;
BEGIN
  IF p_booking.service_area IS NOT NULL AND trim(p_booking.service_area) <> '' THEN
    RETURN trim(p_booking.service_area);
  END IF;

  parsed := NULLIF(trim(substring(p_booking.notes FROM 'Area:\s*([^.]+)')), '');
  RETURN parsed;
END;
$$;

CREATE OR REPLACE FUNCTION provider_offers_booking_service(p_provider_id UUID, p_service_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM provider_services ps
    WHERE ps.provider_id = p_provider_id AND ps.service_id = p_service_id
  ) THEN
    RETURN TRUE;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM services s
    JOIN service_categories sc ON sc.id = s.category_id
    WHERE s.id = p_service_id AND sc.slug = 'cleaning'
  ) THEN
    RETURN EXISTS (
      SELECT 1 FROM providers pr
      WHERE pr.id = p_provider_id AND pr.is_active = true
    );
  END IF;

  RETURN FALSE;
END;
$$;

UPDATE bookings
SET service_area = NULLIF(trim(substring(notes FROM 'Area:\s*([^.]+)')), '')
WHERE service_area IS NULL
  AND notes ~* 'Area:\s*';

UPDATE providers
SET service_areas = ARRAY(
  SELECT trim(area_label)
  FROM unnest(service_areas) AS area_label
  WHERE trim(area_label) <> ''
)
WHERE service_areas IS NOT NULL;

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
  target_area TEXT;
BEGIN
  IF TG_OP <> 'INSERT' THEN RETURN NEW; END IF;

  SELECT s.name, sc.name INTO service_name, category_name
  FROM services s
  JOIN service_categories sc ON sc.id = s.category_id
  WHERE s.id = NEW.service_id;

  pay_label := CASE NEW.payment_method WHEN 'cash' THEN 'CASH' ELSE 'PayNow' END;
  target_area := booking_target_area(NEW);

  IF NEW.provider_id IS NULL THEN
    INSERT INTO notifications (user_id, title, body, type, metadata)
    SELECT DISTINCT p.user_id,
      'New ' || category_name || ' request',
      service_name || ' · ' || pay_label ||
        CASE WHEN target_area IS NOT NULL THEN ' · ' || target_area ELSE '' END ||
        ' · ' || to_char(NEW.scheduled_at, 'DD Mon YYYY HH24:MI'),
      'booking'::notification_type,
      jsonb_build_object(
        'booking_id', NEW.id,
        'service_id', NEW.service_id,
        'payment_method', NEW.payment_method,
        'service_area', target_area,
        'open_request', true
      )
    FROM providers pr
    JOIN profiles p ON p.user_id = pr.user_id
    WHERE pr.is_active = true
      AND provider_offers_booking_service(pr.id, NEW.service_id)
      AND provider_covers_area(pr.service_areas, target_area);

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_activity') THEN
      PERFORM log_activity(
        NEW.customer_id, 'customer', 'service_request_created', 'booking', NEW.id,
        category_name || ' request sent to providers in ' || COALESCE(target_area, 'all areas') ||
          ' (' || pay_label || ')',
        jsonb_build_object(
          'booking_id', NEW.id,
          'service_id', NEW.service_id,
          'payment_method', NEW.payment_method,
          'service_area', target_area
        )
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
    'Your ' || COALESCE(category_name, 'service') || ' request was sent to available providers' ||
      CASE WHEN target_area IS NOT NULL THEN ' in ' || target_area ELSE '' END || '.',
    'booking'::notification_type,
    jsonb_build_object('booking_id', NEW.id, 'payment_method', NEW.payment_method, 'service_area', target_area)
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION provider_accept_booking(p_booking_id UUID)
RETURNS bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row bookings;
  provider_row providers;
  target_area TEXT;
BEGIN
  SELECT * INTO provider_row FROM providers WHERE user_id = auth.uid();
  IF provider_row.id IS NULL THEN RAISE EXCEPTION 'Provider profile not found'; END IF;

  SELECT * INTO row FROM bookings
  WHERE id = p_booking_id AND provider_id IS NULL AND status = 'pending'
  FOR UPDATE;

  IF row.id IS NULL THEN RAISE EXCEPTION 'Open request not available'; END IF;

  IF NOT provider_offers_booking_service(provider_row.id, row.service_id) THEN
    RAISE EXCEPTION 'You do not offer this service';
  END IF;

  target_area := booking_target_area(row);
  IF target_area IS NOT NULL AND NOT provider_covers_area(provider_row.service_areas, target_area) THEN
    RAISE EXCEPTION 'This request is outside your registered service areas';
  END IF;

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
      jsonb_build_object('booking_id', row.id, 'payment_method', row.payment_method, 'service_area', target_area)
    );
  END IF;

  RETURN row;
END;
$$;

GRANT EXECUTE ON FUNCTION provider_accept_booking(UUID) TO authenticated;

-- WhatsApp open-request alerts: same area + service rules as in-app notifications
CREATE OR REPLACE FUNCTION notify_booking_whatsapp_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  service_name TEXT;
  provider_name TEXT;
  provider_user UUID;
  scheduled_label TEXT;
  target_area TEXT;
  msg TEXT;
  r RECORD;
BEGIN
  SELECT s.name INTO service_name FROM services s WHERE s.id = NEW.service_id;
  scheduled_label := to_char(NEW.scheduled_at AT TIME ZONE 'Asia/Singapore', 'DD Mon YYYY HH24:MI');
  target_area := booking_target_area(NEW);

  IF TG_OP = 'INSERT' THEN
    IF NEW.provider_id IS NOT NULL THEN
      SELECT pr.user_id, pr.business_name INTO provider_user, provider_name
      FROM providers pr WHERE pr.id = NEW.provider_id;

      msg := 'Nexo: New booking request for ' || COALESCE(service_name, 'a service') ||
        ' on ' || scheduled_label || '. Open Nexo to review.';
      PERFORM dispatch_booking_whatsapp(provider_user, msg, NEW.id);
    ELSE
      FOR r IN
        SELECT DISTINCT pr.user_id
        FROM providers pr
        WHERE pr.is_active = true
          AND provider_offers_booking_service(pr.id, NEW.service_id)
          AND provider_covers_area(pr.service_areas, target_area)
      LOOP
        msg := 'Nexo: New open ' || COALESCE(service_name, 'service') ||
          CASE WHEN target_area IS NOT NULL THEN ' in ' || target_area ELSE '' END ||
          ' on ' || scheduled_label || '. Open Nexo to accept.';
        PERFORM dispatch_booking_whatsapp(r.user_id, msg, NEW.id);
      END LOOP;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'confirmed' AND NEW.provider_id IS NOT NULL THEN
      SELECT business_name INTO provider_name FROM providers WHERE id = NEW.provider_id;
      msg := 'Nexo: Your booking for ' || COALESCE(service_name, 'a service') ||
        ' is confirmed with ' || COALESCE(provider_name, 'your provider') || ' on ' || scheduled_label || '.';
      PERFORM dispatch_booking_whatsapp(NEW.customer_id, msg, NEW.id);

      SELECT user_id INTO provider_user FROM providers WHERE id = NEW.provider_id;
      msg := 'Nexo: Booking confirmed for ' || COALESCE(service_name, 'a service') ||
        ' on ' || scheduled_label || '.';
      PERFORM dispatch_booking_whatsapp(provider_user, msg, NEW.id);
    ELSIF NEW.status = 'in_progress' THEN
      msg := 'Nexo: Your ' || COALESCE(service_name, 'service') || ' job is now in progress.';
      PERFORM dispatch_booking_whatsapp(NEW.customer_id, msg, NEW.id);
    ELSIF NEW.status = 'completed' THEN
      msg := 'Nexo: Your ' || COALESCE(service_name, 'service') || ' job is marked completed. Leave a review on Nexo!';
      PERFORM dispatch_booking_whatsapp(NEW.customer_id, msg, NEW.id);
      IF NEW.provider_id IS NOT NULL THEN
        SELECT user_id INTO provider_user FROM providers WHERE id = NEW.provider_id;
        PERFORM dispatch_booking_whatsapp(provider_user, 'Nexo: Job completed for ' ||
          COALESCE(service_name, 'service') || '.', NEW.id);
      END IF;
    ELSIF NEW.status = 'cancelled' THEN
      msg := 'Nexo: Booking for ' || COALESCE(service_name, 'a service') || ' on ' ||
        scheduled_label || ' was cancelled.';
      PERFORM dispatch_booking_whatsapp(NEW.customer_id, msg, NEW.id);
      IF NEW.provider_id IS NOT NULL THEN
        SELECT user_id INTO provider_user FROM providers WHERE id = NEW.provider_id;
        PERFORM dispatch_booking_whatsapp(provider_user, msg, NEW.id);
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION
  WHEN others THEN NULL;
END $$;
