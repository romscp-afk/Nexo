-- Customer PayNow includes SGD 3 platform fee; cash jobs: customer pays platform fee via PayNow
-- Run after add-marketplace.sql + add-pricing-units.sql

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
  fee NUMERIC := COALESCE(p_platform_fee, nexo_platform_fee());
  svc NUMERIC := COALESCE(p_service_subtotal, 0);
BEGIN
  IF p_payment_method = 'cash' THEN
    RETURN fee;
  END IF;

  IF p_service_subtotal IS NOT NULL THEN
    RETURN svc + fee;
  END IF;

  IF p_total_price IS NOT NULL AND p_total_price >= fee THEN
    RETURN p_total_price;
  END IF;

  RETURN COALESCE(p_total_price, 0) + fee;
END;
$$;

CREATE OR REPLACE FUNCTION create_payment_on_booking_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payment_ref TEXT;
  fee_ref TEXT;
  provider_name TEXT;
  service_name TEXT;
  pay_amount NUMERIC;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'confirmed'
     AND NEW.provider_id IS NOT NULL THEN

    pay_amount := nexo_customer_paynow_amount(
      NEW.payment_method,
      NEW.service_subtotal,
      NEW.platform_fee,
      NEW.total_price
    );

    payment_ref := nexo_payment_reference(NEW.id);
    SELECT p.business_name INTO provider_name FROM providers p WHERE p.id = NEW.provider_id;
    SELECT s.name INTO service_name FROM services s WHERE s.id = NEW.service_id;

    IF NEW.payment_method = 'paynow' THEN
      INSERT INTO payments (
        booking_id, customer_id, amount, paynow_mobile, reference, payment_kind, booking_details
      ) VALUES (
        NEW.id, NEW.customer_id, pay_amount, '+6587877525', payment_ref, 'customer_advance',
        jsonb_build_object(
          'booking_id', NEW.id, 'reference', payment_ref, 'service_name', service_name,
          'provider_name', provider_name, 'scheduled_at', NEW.scheduled_at,
          'address_line1', NEW.address_line1, 'postal_code', NEW.postal_code,
          'service_subtotal', NEW.service_subtotal,
          'platform_fee', COALESCE(NEW.platform_fee, nexo_platform_fee()),
          'total_price', pay_amount
        )
      ) ON CONFLICT (booking_id, payment_kind) DO NOTHING;

      INSERT INTO notifications (user_id, title, body, type, metadata)
      VALUES (
        NEW.customer_id, 'Pay in advance via PayNow',
        'Pay ' || pay_amount::TEXT || ' SGD (includes platform fee). Ref: ' || payment_ref,
        'booking',
        jsonb_build_object('booking_id', NEW.id, 'payment_reference', payment_ref, 'action', 'paynow')
      );

    ELSIF NEW.payment_method = 'cash' THEN
      INSERT INTO payments (
        booking_id, customer_id, amount, paynow_mobile, reference, payment_kind, booking_details
      ) VALUES (
        NEW.id, NEW.customer_id, pay_amount, '+6587877525', payment_ref, 'customer_advance',
        jsonb_build_object(
          'booking_id', NEW.id, 'reference', payment_ref, 'service_name', service_name,
          'provider_name', provider_name, 'purpose', 'platform_fee',
          'service_subtotal', NEW.service_subtotal,
          'platform_fee', COALESCE(NEW.platform_fee, nexo_platform_fee())
        )
      ) ON CONFLICT (booking_id, payment_kind) DO NOTHING;

      INSERT INTO notifications (user_id, title, body, type, metadata)
      VALUES (
        NEW.customer_id, 'Pay platform fee via PayNow',
        'Pay ' || pay_amount::TEXT || ' SGD platform fee. Ref: ' || payment_ref ||
          '. Pay the provider in cash when the job is done.',
        'booking',
        jsonb_build_object('booking_id', NEW.id, 'payment_reference', payment_ref, 'action', 'paynow')
      );

      PERFORM notify_admins(
        'CASH booking confirmed',
        provider_name || ' — CASH job ' || payment_ref || ' — customer pays platform fee via PayNow',
        jsonb_build_object('booking_id', NEW.id, 'payment_method', 'cash')
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

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
        SELECT 1 FROM payments WHERE booking_id = NEW.id AND payment_kind = 'customer_advance' AND status = 'paid'
      ) AND NOT EXISTS (
        SELECT 1 FROM payments WHERE booking_id = NEW.id AND payment_kind = 'provider_admin_fee' AND status = 'paid'
      ) THEN
        RAISE EXCEPTION 'Customer platform fee must be confirmed before starting';
      END IF;
      IF NEW.customer_contact_shared IS NOT TRUE THEN
        RAISE EXCEPTION 'Customer contact not yet shared — admin must confirm platform fee payment';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION admin_confirm_payment(p_payment_id UUID)
RETURNS payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row payments;
  provider_user_id UUID;
  b bookings;
  cust profiles;
  receipt_num TEXT;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Only admins can confirm payments'; END IF;

  UPDATE payments SET status = 'paid', paid_at = now(), confirmed_by = auth.uid(), updated_at = now()
  WHERE id = p_payment_id AND status IN ('pending', 'submitted')
  RETURNING * INTO row;
  IF row.id IS NULL THEN RAISE EXCEPTION 'Payment not found or already confirmed'; END IF;

  SELECT * INTO b FROM bookings WHERE id = row.booking_id;
  SELECT * INTO cust FROM profiles WHERE user_id = b.customer_id;

  IF row.payment_kind = 'customer_advance' THEN
    IF b.payment_method = 'cash' THEN
      UPDATE bookings SET customer_contact_shared = true WHERE id = row.booking_id;
    END IF;

    PERFORM notify_admins('Payment confirmed',
      'Customer PayNow $' || row.amount || ' received — ref ' || row.reference ||
        ' · ' || COALESCE(row.booking_details->>'service_name', 'Service') ||
        ' · ' || COALESCE(row.booking_details->>'provider_name', 'Provider'),
      jsonb_build_object('payment_id', row.id, 'booking_id', row.booking_id, 'amount', row.amount,
        'booking_details', row.booking_details));

    INSERT INTO notifications (user_id, title, body, type, metadata)
    VALUES (row.customer_id, 'Payment confirmed',
      CASE WHEN b.payment_method = 'cash'
        THEN 'Platform fee confirmed — ref ' || row.reference || '. Pay the provider in cash when the job is done.'
        ELSE 'PayNow ref ' || row.reference || ' verified. Provider can start your job.'
      END,
      'booking', jsonb_build_object('booking_id', row.booking_id, 'payment_id', row.id));

    SELECT pr.user_id INTO provider_user_id FROM providers pr WHERE pr.id = b.provider_id;
    IF provider_user_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, body, type, metadata)
      VALUES (provider_user_id,
        CASE WHEN b.payment_method = 'cash' THEN 'Customer platform fee received' ELSE 'Customer payment received' END,
        CASE WHEN b.payment_method = 'cash'
          THEN 'Platform fee confirmed — ref ' || row.reference || '. Customer: ' || cust.full_name ||
            ' · ' || COALESCE(cust.phone, 'no phone') || ' · ' || b.address_line1
          ELSE 'Advance payment confirmed — ref ' || row.reference || '. You may start the job.'
        END,
        'booking', jsonb_build_object('booking_id', row.booking_id));
    END IF;

  ELSIF row.payment_kind = 'provider_admin_fee' THEN
    UPDATE bookings SET customer_contact_shared = true WHERE id = row.booking_id;

    receipt_num := nexo_receipt_number(row.booking_id, 'P');
    INSERT INTO receipts (booking_id, payment_id, recipient_id, recipient_role, receipt_number, amount, payment_method, details)
    SELECT row.booking_id, row.id, pr.user_id, 'provider', receipt_num, row.amount, 'cash',
      jsonb_build_object(
        'reference', row.reference, 'service_name', row.booking_details->>'service_name',
        'admin_fee', row.amount, 'type', 'provider_admin_fee_receipt'
      )
    FROM providers pr WHERE pr.id = b.provider_id
    ON CONFLICT (receipt_number) DO NOTHING;

    SELECT pr.user_id INTO provider_user_id FROM providers pr WHERE pr.id = b.provider_id;
    IF provider_user_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, body, type, metadata)
      VALUES (provider_user_id, 'Admin fee confirmed — receipt issued',
        'Receipt ' || receipt_num || '. Customer contact: ' || cust.full_name ||
          ' · ' || COALESCE(cust.phone, 'no phone') || ' · ' || b.address_line1,
        'system', jsonb_build_object('booking_id', row.booking_id, 'receipt_number', receipt_num,
          'customer_phone', cust.phone, 'customer_name', cust.full_name));
    END IF;

    PERFORM notify_admins('Provider admin fee confirmed',
      'Ref ' || row.reference || ' — $' || row.amount,
      jsonb_build_object('payment_id', row.id, 'booking_id', row.booking_id));
  END IF;

  PERFORM log_activity(auth.uid(), 'admin', 'payment_confirmed', 'payment', row.id,
    'Confirmed ' || row.payment_kind || ' — ref ' || row.reference || ' ($' || row.amount || ')',
    jsonb_build_object('payment_id', row.id, 'booking_id', row.booking_id, 'kind', row.payment_kind));

  PERFORM log_audit_action('confirm_payment', 'payment', row.id,
    jsonb_build_object('booking_id', row.booking_id, 'reference', row.reference, 'kind', row.payment_kind));

  RETURN row;
END;
$$;
