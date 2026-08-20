-- Provider pays 10% platform fee per job; customers pay service amount only.
-- Safe to re-run.

-- Customer platform fee is no longer charged.
CREATE OR REPLACE FUNCTION nexo_platform_fee()
RETURNS NUMERIC AS $$
  SELECT 0::NUMERIC;
$$ LANGUAGE sql IMMUTABLE;

-- Fallback fixed amount if subtotal is missing (legacy).
CREATE OR REPLACE FUNCTION nexo_admin_fee()
RETURNS NUMERIC AS $$
  SELECT 5::NUMERIC;
$$ LANGUAGE sql IMMUTABLE;

-- Provider platform fee = 10% of service subtotal.
CREATE OR REPLACE FUNCTION nexo_provider_platform_fee(p_service_subtotal NUMERIC)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_service_subtotal IS NULL OR p_service_subtotal <= 0 THEN nexo_admin_fee()
    ELSE ROUND(p_service_subtotal * 0.10, 2)
  END;
$$;

ALTER TABLE bookings ALTER COLUMN platform_fee SET DEFAULT 0;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'admin_fee'
  ) THEN
    ALTER TABLE bookings ALTER COLUMN admin_fee SET DEFAULT 5;
  END IF;
END $$;

-- Customer PayNow = service only (cash = 0, no customer platform fee).
CREATE OR REPLACE FUNCTION nexo_customer_paynow_amount(
  p_payment_method booking_payment_method,
  p_service_subtotal NUMERIC,
  p_platform_fee NUMERIC,
  p_total_price NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  svc NUMERIC := COALESCE(p_service_subtotal, p_total_price, 0);
BEGIN
  IF p_payment_method = 'cash' THEN
    RETURN 0;
  END IF;
  RETURN GREATEST(svc, 0);
END;
$$;

-- Upsert customer advance only when PayNow amount > 0.
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

  IF pay_amount <= 0 THEN
    RETURN NULL;
  END IF;

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
      'platform_fee', 0,
      'total_price', pay_amount,
      'purpose', 'advance'
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

  -- Only create customer PayNow for paynow jobs (service amount).
  IF NEW.payment_method = 'paynow' THEN
    PERFORM upsert_customer_advance_payment(NEW, NULL);

    payment_ref := nexo_payment_reference(NEW.id);
    pay_amount := nexo_customer_paynow_amount(
      NEW.payment_method,
      NEW.service_subtotal,
      NEW.platform_fee,
      NEW.total_price
    );

    INSERT INTO notifications (user_id, title, body, type, metadata)
    VALUES (
      NEW.customer_id,
      'Pay via PayNow',
      'Scan the QR on your booking page. Pay ' || pay_amount::TEXT || ' SGD. Ref: ' || payment_ref,
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

-- Helper: upsert provider 10% platform fee payment.
CREATE OR REPLACE FUNCTION upsert_provider_platform_fee_payment(
  p_booking bookings,
  p_provider_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fee_ref TEXT;
  service_name TEXT;
  fee_amount NUMERIC;
  payment_id UUID;
BEGIN
  fee_amount := nexo_provider_platform_fee(p_booking.service_subtotal);
  fee_ref := nexo_admin_fee_reference(p_booking.id);
  SELECT s.name INTO service_name FROM services s WHERE s.id = p_booking.service_id;

  -- Keep bookings.admin_fee in sync with computed 10%.
  UPDATE bookings
  SET admin_fee = fee_amount, platform_fee = 0, updated_at = now()
  WHERE id = p_booking.id;

  INSERT INTO payments (
    booking_id, customer_id, amount, paynow_mobile, reference, payment_kind, booking_details
  ) VALUES (
    p_booking.id,
    p_booking.customer_id,
    fee_amount,
    '+6587877525',
    fee_ref,
    'provider_admin_fee',
    jsonb_build_object(
      'booking_id', p_booking.id,
      'reference', fee_ref,
      'service_name', service_name,
      'provider_name', p_provider_name,
      'purpose', 'platform_fee',
      'fee_percent', 10,
      'service_subtotal', p_booking.service_subtotal,
      'platform_fee', fee_amount
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

CREATE OR REPLACE FUNCTION create_payment_on_booking_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  provider_name TEXT;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'confirmed'
     AND NEW.provider_id IS NOT NULL THEN

    SELECT p.business_name INTO provider_name FROM providers p WHERE p.id = NEW.provider_id;

    IF NEW.payment_method = 'paynow' THEN
      PERFORM upsert_customer_advance_payment(NEW, provider_name);
    END IF;

    -- Provider pays 10% platform fee on every accepted job.
    PERFORM upsert_provider_platform_fee_payment(NEW, provider_name);

    IF NEW.payment_method = 'cash' THEN
      PERFORM notify_admins(
        'CASH booking confirmed',
        COALESCE(provider_name, 'Provider') || ' — CASH job ' || nexo_payment_reference(NEW.id) ||
          ' — provider pays 10% platform fee via PayNow',
        jsonb_build_object('booking_id', NEW.id, 'payment_method', 'cash')
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Accept open request: keep broadcast alerts + create provider 10% fee.
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

  IF row.id IS NULL THEN RAISE EXCEPTION 'Open request not available — another provider may have accepted it'; END IF;

  IF NOT provider_offers_booking_service(provider_row.id, row.service_id) THEN
    RAISE EXCEPTION 'You do not offer this service';
  END IF;

  target_area := booking_target_area(row);

  UPDATE bookings
  SET
    provider_id = provider_row.id,
    status = 'confirmed',
    admin_fee = nexo_provider_platform_fee(service_subtotal),
    platform_fee = 0,
    updated_at = now()
  WHERE id = p_booking_id
  RETURNING * INTO row;

  PERFORM upsert_provider_platform_fee_payment(row, provider_row.business_name);

  IF row.payment_method = 'paynow' THEN
    PERFORM upsert_customer_advance_payment(row, provider_row.business_name);
  END IF;

  INSERT INTO notifications (user_id, title, body, type, metadata)
  VALUES (
    row.customer_id,
    'Booking confirmed',
    provider_row.business_name || ' accepted your request. ' ||
      CASE row.payment_method
        WHEN 'paynow' THEN 'Please complete PayNow payment to proceed.'
        ELSE 'Pay the provider in cash on completion.'
      END,
    'booking'::notification_type,
    jsonb_build_object('booking_id', row.id, 'payment_method', row.payment_method)
  );

  INSERT INTO notifications (user_id, title, body, type, metadata)
  SELECT DISTINCT p.user_id,
    'Open request taken',
    provider_row.business_name || ' accepted this job' ||
      CASE WHEN target_area IS NOT NULL THEN ' in ' || target_area ELSE '' END ||
      '. It is no longer available.',
    'booking'::notification_type,
    jsonb_build_object('booking_id', row.id, 'taken_by_provider_id', provider_row.id, 'open_request', false)
  FROM providers pr
  JOIN profiles p ON p.user_id = pr.user_id
  WHERE pr.is_active = true
    AND pr.id <> provider_row.id
    AND provider_offers_booking_service(pr.id, row.service_id);

  PERFORM notify_admins(
    CASE WHEN row.payment_method = 'cash' THEN 'CASH job accepted' ELSE 'Booking accepted' END,
    provider_row.business_name || ' accepted booking ' || nexo_payment_reference(row.id) ||
      ' — awaiting 10% platform fee PayNow',
    jsonb_build_object('booking_id', row.id, 'provider_id', provider_row.id, 'payment_method', row.payment_method)
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

-- Start job: paynow needs customer payment; cash needs provider 10% fee.
CREATE OR REPLACE FUNCTION enforce_payment_before_start()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = 'confirmed' AND NEW.status = 'in_progress' THEN
    IF NEW.payment_method = 'paynow' THEN
      IF NOT EXISTS (
        SELECT 1 FROM payments WHERE booking_id = NEW.id AND payment_kind = 'customer_advance' AND status = 'paid'
      ) THEN
        RAISE EXCEPTION 'Customer PayNow payment must be confirmed before starting';
      END IF;
    ELSIF NEW.payment_method = 'cash' THEN
      IF NOT EXISTS (
        SELECT 1 FROM payments WHERE booking_id = NEW.id AND payment_kind = 'provider_admin_fee' AND status = 'paid'
      ) THEN
        RAISE EXCEPTION 'Provider platform fee must be confirmed before starting';
      END IF;
      IF NEW.customer_contact_shared IS NOT TRUE THEN
        RAISE EXCEPTION 'Customer contact not yet shared — admin must confirm provider platform fee';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Cancel leftover cash customer platform-fee payments that are still pending.
UPDATE payments p
SET status = 'refunded', updated_at = now()
FROM bookings b
WHERE p.booking_id = b.id
  AND p.payment_kind = 'customer_advance'
  AND b.payment_method = 'cash'
  AND p.status IN ('pending', 'submitted');

DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION
  WHEN others THEN NULL;
END $$;
