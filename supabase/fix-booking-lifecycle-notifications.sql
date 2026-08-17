-- Booking lifecycle: chat cash rules + status notifications for customer, provider, admin.
-- Safe to re-run.

-- Align DB chat gate with frontend (cash platform fee via customer_advance)
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
        AND p.payment_kind IN ('customer_advance', 'provider_admin_fee')
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

-- Notify customer, provider, and admin when booking status changes
CREATE OR REPLACE FUNCTION notify_booking_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  provider_user_id UUID;
  ref TEXT;
  customer_title TEXT;
  customer_body TEXT;
  provider_title TEXT;
  provider_body TEXT;
BEGIN
  IF TG_OP <> 'UPDATE' OR OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  ref := nexo_payment_reference(NEW.id);

  IF NEW.provider_id IS NOT NULL THEN
    SELECT user_id INTO provider_user_id FROM providers WHERE id = NEW.provider_id;
  END IF;

  customer_title := NULL;
  customer_body := NULL;
  provider_title := NULL;
  provider_body := NULL;

  CASE NEW.status
    WHEN 'confirmed' THEN
      customer_title := 'Booking confirmed';
      customer_body := 'Your booking is confirmed. Complete payment if you have not already.';
      IF provider_user_id IS NOT NULL THEN
        provider_title := 'Booking confirmed';
        provider_body := 'The booking is confirmed. Start the job once payment is verified.';
      END IF;
    WHEN 'in_progress' THEN
      customer_title := 'Provider started your job';
      customer_body := 'Your provider has started the service.';
      IF provider_user_id IS NOT NULL THEN
        provider_title := 'Job started';
        provider_body := 'You marked this booking as in progress.';
      END IF;
    WHEN 'completed' THEN
      customer_title := 'Job completed';
      customer_body := 'Your service is complete. Please leave a review for your provider.';
      IF provider_user_id IS NOT NULL THEN
        provider_title := 'Job completed';
        provider_body := 'You marked this booking as complete. The customer may leave a review.';
      END IF;
    WHEN 'cancelled' THEN
      customer_title := 'Booking cancelled';
      customer_body := 'This booking was cancelled.';
      IF provider_user_id IS NOT NULL THEN
        provider_title := 'Booking cancelled';
        provider_body := 'This booking was cancelled.';
      END IF;
    ELSE
      NULL;
  END CASE;

  IF customer_title IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, body, type, metadata)
    VALUES (
      NEW.customer_id,
      customer_title,
      customer_body,
      'booking'::notification_type,
      jsonb_build_object('booking_id', NEW.id, 'status', NEW.status, 'old_status', OLD.status)
    );
  END IF;

  IF provider_user_id IS NOT NULL AND provider_title IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, body, type, metadata)
    VALUES (
      provider_user_id,
      provider_title,
      provider_body,
      'booking'::notification_type,
      jsonb_build_object('booking_id', NEW.id, 'status', NEW.status, 'old_status', OLD.status)
    );
  END IF;

  IF NEW.status IN ('in_progress', 'completed') THEN
    PERFORM notify_admins(
      CASE NEW.status
        WHEN 'in_progress' THEN 'Provider started job'
        ELSE 'Job completed'
      END,
      'Booking ' || ref || ' is now ' || replace(NEW.status::TEXT, '_', ' ') || '.',
      jsonb_build_object('booking_id', NEW.id, 'status', NEW.status, 'old_status', OLD.status)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_notify_status_change ON bookings;
CREATE TRIGGER bookings_notify_status_change
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW EXECUTE FUNCTION notify_booking_status_change();

-- Notify provider when customer submits a review
CREATE OR REPLACE FUNCTION notify_review_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  provider_user_id UUID;
BEGIN
  INSERT INTO notifications (user_id, title, body, type, metadata)
  VALUES (
    NEW.customer_id,
    'Review submitted',
    'Thanks for rating your provider. Your feedback helps others book with confidence.',
    'review'::notification_type,
    jsonb_build_object('booking_id', NEW.booking_id, 'review_id', NEW.id)
  );

  SELECT pr.user_id INTO provider_user_id
  FROM providers pr
  WHERE pr.id = NEW.provider_id;

  IF provider_user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, body, type, metadata)
    VALUES (
      provider_user_id,
      'New customer review',
      'You received a ' || NEW.rating || '-star review for a completed job.',
      'review'::notification_type,
      jsonb_build_object('booking_id', NEW.booking_id, 'review_id', NEW.id, 'rating', NEW.rating)
    );
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
