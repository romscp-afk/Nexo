-- Create customer PayNow payment when booking is submitted (not only on provider confirm).
-- Safe to re-run.

CREATE OR REPLACE FUNCTION upsert_customer_advance_payment(
  p_booking bookings,
  p_provider_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payment_ref TEXT;
  service_name TEXT;
  pay_amount NUMERIC;
  payment_id UUID;
BEGIN
  pay_amount := nexo_customer_paynow_amount(
    p_booking.payment_method,
    p_booking.service_subtotal,
    p_booking.platform_fee,
    p_booking.total_price
  );

  payment_ref := nexo_payment_reference(p_booking.id);
  SELECT s.name INTO service_name FROM services s WHERE s.id = p_booking.service_id;

  INSERT INTO payments (
    booking_id, customer_id, amount, paynow_mobile, reference, payment_kind, booking_details
  ) VALUES (
    p_booking.id,
    p_booking.customer_id,
    pay_amount,
    '+6587877525',
    payment_ref,
    'customer_advance',
    jsonb_build_object(
      'booking_id', p_booking.id,
      'reference', payment_ref,
      'service_name', service_name,
      'provider_name', p_provider_name,
      'scheduled_at', p_booking.scheduled_at,
      'address_line1', p_booking.address_line1,
      'postal_code', p_booking.postal_code,
      'service_subtotal', p_booking.service_subtotal,
      'platform_fee', COALESCE(p_booking.platform_fee, nexo_platform_fee()),
      'total_price', pay_amount,
      'purpose', CASE WHEN p_booking.payment_method = 'cash' THEN 'platform_fee' ELSE 'advance' END
    )
  )
  ON CONFLICT (booking_id, payment_kind) DO UPDATE SET
    amount = EXCLUDED.amount,
    booking_details = payments.booking_details || EXCLUDED.booking_details,
    updated_at = now()
  RETURNING id INTO payment_id;

  RETURN payment_id;
END;
$$;

CREATE OR REPLACE FUNCTION create_payment_on_booking_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payment_ref TEXT;
  pay_amount NUMERIC;
BEGIN
  IF NEW.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  PERFORM upsert_customer_advance_payment(NEW, NULL);

  payment_ref := nexo_payment_reference(NEW.id);
  pay_amount := nexo_customer_paynow_amount(
    NEW.payment_method,
    NEW.service_subtotal,
    NEW.platform_fee,
    NEW.total_price
  );

  IF NEW.payment_method = 'paynow' THEN
    INSERT INTO notifications (user_id, title, body, type, metadata)
    VALUES (
      NEW.customer_id,
      'Pay via PayNow',
      'Scan the QR on your booking page. Pay ' || pay_amount::TEXT || ' SGD. Ref: ' || payment_ref,
      'booking'::notification_type,
      jsonb_build_object('booking_id', NEW.id, 'payment_reference', payment_ref, 'action', 'paynow')
    );
  ELSE
    INSERT INTO notifications (user_id, title, body, type, metadata)
    VALUES (
      NEW.customer_id,
      'Pay platform fee via PayNow',
      'Scan the QR on your booking page. Pay ' || pay_amount::TEXT || ' SGD platform fee. Ref: ' || payment_ref,
      'booking'::notification_type,
      jsonb_build_object('booking_id', NEW.id, 'payment_reference', payment_ref, 'action', 'paynow')
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_create_payment_on_insert ON bookings;
CREATE TRIGGER bookings_create_payment_on_insert
  AFTER INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION create_payment_on_booking_insert();

CREATE OR REPLACE FUNCTION create_payment_on_booking_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  provider_name TEXT;
  payment_ref TEXT;
  pay_amount NUMERIC;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'confirmed'
     AND NEW.provider_id IS NOT NULL THEN

    SELECT p.business_name INTO provider_name FROM providers p WHERE p.id = NEW.provider_id;
    PERFORM upsert_customer_advance_payment(NEW, provider_name);

    IF NEW.payment_method = 'cash' THEN
      payment_ref := nexo_payment_reference(NEW.id);
      pay_amount := nexo_customer_paynow_amount(
        NEW.payment_method,
        NEW.service_subtotal,
        NEW.platform_fee,
        NEW.total_price
      );

      PERFORM notify_admins(
        'CASH booking confirmed',
        COALESCE(provider_name, 'Provider') || ' — CASH job ' || payment_ref ||
          ' — customer pays platform fee via PayNow',
        jsonb_build_object('booking_id', NEW.id, 'payment_method', 'cash')
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Backfill payments for active bookings missing a customer_advance row
INSERT INTO payments (
  booking_id, customer_id, amount, paynow_mobile, reference, payment_kind, booking_details
)
SELECT
  b.id,
  b.customer_id,
  nexo_customer_paynow_amount(b.payment_method, b.service_subtotal, b.platform_fee, b.total_price),
  '+6587877525',
  nexo_payment_reference(b.id),
  'customer_advance',
  jsonb_build_object(
    'booking_id', b.id,
    'reference', nexo_payment_reference(b.id),
    'service_subtotal', b.service_subtotal,
    'platform_fee', COALESCE(b.platform_fee, nexo_platform_fee()),
    'total_price', nexo_customer_paynow_amount(b.payment_method, b.service_subtotal, b.platform_fee, b.total_price),
    'purpose', CASE WHEN b.payment_method = 'cash' THEN 'platform_fee' ELSE 'advance' END
  )
FROM bookings b
WHERE b.status IN ('pending', 'confirmed', 'in_progress')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.booking_id = b.id AND p.payment_kind = 'customer_advance'
  );

DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION
  WHEN others THEN NULL;
END $$;
