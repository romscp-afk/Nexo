-- Fix: notification type must be cast in INSERT...SELECT (text vs notification_type enum).
-- Safe to re-run.

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
      'booking'::notification_type,
      jsonb_build_object('booking_id', NEW.id, 'status', NEW.status)
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

CREATE OR REPLACE FUNCTION notify_admins(p_title TEXT, p_body TEXT, p_metadata JSONB DEFAULT '{}')
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO notifications (user_id, title, body, type, metadata)
  SELECT p.user_id, p_title, p_body, 'system'::notification_type, p_metadata
  FROM profiles p WHERE p.role = 'admin';
END;
$$;

DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION
  WHEN others THEN NULL;
END $$;
