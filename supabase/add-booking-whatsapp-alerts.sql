-- WhatsApp alerts for booking events (via send-booking-whatsapp edge function)

INSERT INTO platform_settings (key, value)
VALUES
  ('booking_whatsapp_function_url', 'https://zitofnocwbpoczqdrdbr.supabase.co/functions/v1/send-booking-whatsapp'),
  ('booking_whatsapp_webhook_secret', 'nexo-booking-whatsapp-change-me')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION dispatch_booking_whatsapp(
  p_recipient_user_id UUID,
  p_message TEXT,
  p_booking_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fn_url TEXT;
  webhook_secret TEXT;
BEGIN
  IF p_recipient_user_id IS NULL OR p_message IS NULL OR length(trim(p_message)) = 0 THEN
    RETURN;
  END IF;

  fn_url := get_platform_setting('booking_whatsapp_function_url');
  webhook_secret := get_platform_setting('booking_whatsapp_webhook_secret');
  IF fn_url IS NULL OR webhook_secret IS NULL THEN
    RETURN;
  END IF;

  PERFORM extensions.net.http_post(
    url := fn_url,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'webhook_secret', webhook_secret,
      'recipient_user_id', p_recipient_user_id,
      'message', p_message,
      'booking_id', p_booking_id
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END;
$$;

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
  msg TEXT;
  r RECORD;
BEGIN
  SELECT s.name INTO service_name FROM services s WHERE s.id = NEW.service_id;
  scheduled_label := to_char(NEW.scheduled_at AT TIME ZONE 'Asia/Singapore', 'DD Mon YYYY HH24:MI');

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
        FROM provider_services ps
        JOIN providers pr ON pr.id = ps.provider_id AND pr.is_active = true
        WHERE ps.service_id = NEW.service_id
      LOOP
        msg := 'Nexo: New open ' || COALESCE(service_name, 'service') || ' request on ' ||
          scheduled_label || '. Open Nexo to accept.';
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

DROP TRIGGER IF EXISTS bookings_whatsapp_notify ON bookings;
CREATE TRIGGER bookings_whatsapp_notify
  AFTER INSERT OR UPDATE OF status ON bookings
  FOR EACH ROW EXECUTE FUNCTION notify_booking_whatsapp_events();
