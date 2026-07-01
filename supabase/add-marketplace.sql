-- Marketplace: category broadcast, PayNow/Cash, admin fees, receipts
-- Run after schema.sql + add-payments.sql
-- PayNow platform account: +6587877525 | Admin fee (cash jobs): $25 SGD

DO $$ BEGIN CREATE TYPE booking_payment_method AS ENUM ('paynow', 'cash');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE payment_kind AS ENUM ('customer_advance', 'provider_admin_fee');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE bookings ALTER COLUMN provider_id DROP NOT NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method booking_payment_method NOT NULL DEFAULT 'paynow';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS admin_fee NUMERIC(10,2) NOT NULL DEFAULT 25;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_contact_shared BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_kind payment_kind NOT NULL DEFAULT 'customer_advance';
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_booking_id_key;
DROP INDEX IF EXISTS payments_booking_kind_unique;
CREATE UNIQUE INDEX payments_booking_kind_unique ON payments(booking_id, payment_kind);

CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_role user_role NOT NULL,
  receipt_number TEXT NOT NULL UNIQUE,
  amount NUMERIC(10,2) NOT NULL,
  payment_method booking_payment_method NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_receipts_booking ON receipts(booking_id);
CREATE INDEX IF NOT EXISTS idx_receipts_recipient ON receipts(recipient_id);

-- ─── Helpers ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION nexo_admin_fee()
RETURNS NUMERIC LANGUAGE sql IMMUTABLE AS $$ SELECT 25::NUMERIC; $$;

CREATE OR REPLACE FUNCTION nexo_receipt_number(p_booking_id UUID, p_suffix TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT 'RCP-' || UPPER(SUBSTRING(REPLACE(p_booking_id::TEXT, '-', ''), 1, 8)) || '-' || p_suffix;
$$;

CREATE OR REPLACE FUNCTION nexo_admin_fee_reference(p_booking_id UUID)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT 'NEXO-FEE-' || UPPER(SUBSTRING(REPLACE(p_booking_id::TEXT, '-', ''), 1, 8));
$$;

CREATE OR REPLACE FUNCTION notify_admins(p_title TEXT, p_body TEXT, p_metadata JSONB DEFAULT '{}')
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO notifications (user_id, title, body, type, metadata)
  SELECT p.user_id, p_title, p_body, 'system', p_metadata
  FROM profiles p WHERE p.role = 'admin';
END;
$$;

-- ─── Broadcast to all providers in service category ──────────────────────────

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
      service_name || ' · ' || pay_label || ' · ' || to_char(NEW.scheduled_at, 'DD Mon YYYY HH24:MI') ||
        CASE WHEN NEW.payment_method = 'cash' THEN ' — CASH job (pay admin fee after accepting)' ELSE '' END,
      'booking',
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

    PERFORM log_activity(
      NEW.customer_id, 'customer', 'service_request_created', 'booking', NEW.id,
      category_name || ' request broadcast to all providers (' || pay_label || ')',
      jsonb_build_object('booking_id', NEW.id, 'service_id', NEW.service_id, 'payment_method', NEW.payment_method)
    );
  ELSE
    INSERT INTO notifications (user_id, title, body, type, metadata)
    SELECT pr.user_id, 'New booking request', service_name || ' · ' || pay_label,
      'booking', jsonb_build_object('booking_id', NEW.id, 'status', NEW.status)
    FROM providers pr WHERE pr.id = NEW.provider_id;
  END IF;

  INSERT INTO notifications (user_id, title, body, type, metadata)
  VALUES (
    NEW.customer_id,
    'Request submitted',
    'Your ' || COALESCE(category_name, 'service') || ' request was sent to available providers.',
    'booking',
    jsonb_build_object('booking_id', NEW.id, 'payment_method', NEW.payment_method)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_notify_participants ON bookings;
CREATE TRIGGER bookings_notify_category_request
  AFTER INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION notify_category_providers_on_request();

-- ─── Provider accepts open request ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION provider_accept_booking(p_booking_id UUID)
RETURNS bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row bookings;
  provider_row providers;
  service_name TEXT;
  fee_ref TEXT;
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

  SELECT name INTO service_name FROM services WHERE id = row.service_id;

  IF row.payment_method = 'cash' THEN
    fee_ref := nexo_admin_fee_reference(row.id);
    INSERT INTO payments (
      booking_id, customer_id, amount, paynow_mobile, reference, payment_kind, booking_details
    ) VALUES (
      row.id, row.customer_id, row.admin_fee, '+6587877525', fee_ref, 'provider_admin_fee',
      jsonb_build_object(
        'booking_id', row.id, 'reference', fee_ref, 'service_name', service_name,
        'provider_name', provider_row.business_name, 'purpose', 'admin_fee'
      )
    ) ON CONFLICT (booking_id, payment_kind) DO NOTHING;

    PERFORM notify_admins(
      'CASH job accepted',
      provider_row.business_name || ' accepted CASH booking ' || nexo_payment_reference(row.id) ||
        ' — awaiting admin fee PayNow',
      jsonb_build_object('booking_id', row.id, 'provider_id', provider_row.id, 'payment_method', 'cash')
    );
  END IF;

  INSERT INTO notifications (user_id, title, body, type, metadata)
  VALUES (
    row.customer_id,
    'Booking confirmed',
    provider_row.business_name || ' accepted your request. ' ||
      CASE row.payment_method
        WHEN 'paynow' THEN 'Please complete PayNow payment to proceed.'
        ELSE 'Pay the provider in cash on completion. Provider will pay platform fee.'
      END,
    'booking',
    jsonb_build_object('booking_id', row.id, 'payment_method', row.payment_method)
  );

  PERFORM log_activity(
    auth.uid(), 'provider', 'booking_accepted', 'booking', row.id,
    provider_row.business_name || ' accepted ' || CASE row.payment_method WHEN 'cash' THEN 'CASH' ELSE 'PayNow' END || ' job',
    jsonb_build_object('booking_id', row.id, 'payment_method', row.payment_method)
  );

  RETURN row;
END;
$$;

GRANT EXECUTE ON FUNCTION provider_accept_booking(UUID) TO authenticated;

-- ─── Customer advance payment on confirm (PayNow only) ─────────────────────

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
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'confirmed'
     AND NEW.provider_id IS NOT NULL THEN

    IF NEW.payment_method = 'paynow' THEN
      payment_ref := nexo_payment_reference(NEW.id);
      SELECT p.business_name INTO provider_name FROM providers p WHERE p.id = NEW.provider_id;
      SELECT s.name INTO service_name FROM services s WHERE s.id = NEW.service_id;

      INSERT INTO payments (
        booking_id, customer_id, amount, paynow_mobile, reference, payment_kind, booking_details
      ) VALUES (
        NEW.id, NEW.customer_id, COALESCE(NEW.total_price, 0), '+6587877525', payment_ref, 'customer_advance',
        jsonb_build_object(
          'booking_id', NEW.id, 'reference', payment_ref, 'service_name', service_name,
          'provider_name', provider_name, 'scheduled_at', NEW.scheduled_at,
          'address_line1', NEW.address_line1, 'postal_code', NEW.postal_code, 'total_price', NEW.total_price
        )
      ) ON CONFLICT (booking_id, payment_kind) DO NOTHING;

      INSERT INTO notifications (user_id, title, body, type, metadata)
      VALUES (
        NEW.customer_id, 'Pay in advance via PayNow',
        'Pay ' || COALESCE(NEW.total_price::TEXT, '0') || ' SGD. Ref: ' || payment_ref,
        'booking',
        jsonb_build_object('booking_id', NEW.id, 'payment_reference', payment_ref, 'action', 'paynow')
      );

    ELSIF NEW.payment_method = 'cash' THEN
      fee_ref := nexo_admin_fee_reference(NEW.id);
      SELECT p.business_name INTO provider_name FROM providers p WHERE p.id = NEW.provider_id;
      SELECT s.name INTO service_name FROM services s WHERE s.id = NEW.service_id;

      INSERT INTO payments (
        booking_id, customer_id, amount, paynow_mobile, reference, payment_kind, booking_details
      ) VALUES (
        NEW.id, NEW.customer_id, NEW.admin_fee, '+6587877525', fee_ref, 'provider_admin_fee',
        jsonb_build_object(
          'booking_id', NEW.id, 'reference', fee_ref, 'service_name', service_name,
          'provider_name', provider_name, 'purpose', 'admin_fee'
        )
      ) ON CONFLICT (booking_id, payment_kind) DO NOTHING;

      PERFORM notify_admins(
        'CASH booking confirmed',
        provider_name || ' — CASH job ' || nexo_payment_reference(NEW.id) || ' — awaiting admin fee',
        jsonb_build_object('booking_id', NEW.id, 'payment_method', 'cash')
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ─── Payment gate before start ───────────────────────────────────────────────

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
        RAISE EXCEPTION 'Provider admin fee must be confirmed before starting';
      END IF;
      IF NEW.customer_contact_shared IS NOT TRUE THEN
        RAISE EXCEPTION 'Customer contact not yet shared — admin must confirm provider fee';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ─── Customer submit payment ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION customer_submit_payment(p_payment_id UUID, p_note TEXT DEFAULT NULL)
RETURNS payments
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE row payments;
BEGIN
  UPDATE payments SET status = 'submitted', customer_note = p_note, updated_at = now()
  WHERE id = p_payment_id AND customer_id = auth.uid() AND status = 'pending'
    AND payment_kind = 'customer_advance'
  RETURNING * INTO row;
  IF row.id IS NULL THEN RAISE EXCEPTION 'Payment not found or already submitted'; END IF;

  PERFORM log_activity(auth.uid(), 'customer', 'payment_submitted', 'payment', row.id,
    'Customer marked PayNow sent — ref ' || row.reference,
    jsonb_build_object('payment_id', row.id, 'booking_id', row.booking_id, 'reference', row.reference));

  PERFORM notify_admins('Payment submitted for review',
    'Ref ' || row.reference || ' — $' || row.amount || ' — verify PayNow transfer',
    jsonb_build_object('payment_id', row.id, 'booking_id', row.booking_id, 'reference', row.reference));

  RETURN row;
END;
$$;

-- ─── Provider submit admin fee ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION provider_submit_admin_fee(p_payment_id UUID, p_note TEXT DEFAULT NULL)
RETURNS payments
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE row payments;
BEGIN
  UPDATE payments SET status = 'submitted', customer_note = p_note, updated_at = now()
  WHERE id = p_payment_id AND payment_kind = 'provider_admin_fee' AND status = 'pending'
    AND EXISTS (
      SELECT 1 FROM bookings b JOIN providers p ON p.id = b.provider_id
      WHERE b.id = payments.booking_id AND p.user_id = auth.uid()
    )
  RETURNING * INTO row;
  IF row.id IS NULL THEN RAISE EXCEPTION 'Admin fee payment not found or already submitted'; END IF;

  PERFORM log_activity(auth.uid(), 'provider', 'admin_fee_submitted', 'payment', row.id,
    'Provider marked admin fee PayNow sent — ref ' || row.reference,
    jsonb_build_object('payment_id', row.id, 'booking_id', row.booking_id));

  PERFORM notify_admins('Provider admin fee submitted',
    'Ref ' || row.reference || ' — $' || row.amount || ' — verify PayNow',
    jsonb_build_object('payment_id', row.id, 'booking_id', row.booking_id));

  RETURN row;
END;
$$;

GRANT EXECUTE ON FUNCTION provider_submit_admin_fee(UUID, TEXT) TO authenticated;

-- ─── Admin confirm payment ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION admin_confirm_payment(p_payment_id UUID)
RETURNS payments
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
    PERFORM notify_admins('Payment confirmed',
      'Customer PayNow $' || row.amount || ' received — ref ' || row.reference ||
        ' · ' || COALESCE(row.booking_details->>'service_name', 'Service') ||
        ' · ' || COALESCE(row.booking_details->>'provider_name', 'Provider'),
      jsonb_build_object('payment_id', row.id, 'booking_id', row.booking_id, 'amount', row.amount,
        'booking_details', row.booking_details));

    INSERT INTO notifications (user_id, title, body, type, metadata)
    VALUES (row.customer_id, 'Payment confirmed',
      'PayNow ref ' || row.reference || ' verified. Provider can start your job.',
      'booking', jsonb_build_object('booking_id', row.booking_id, 'payment_id', row.id));

    SELECT pr.user_id INTO provider_user_id FROM providers pr WHERE pr.id = b.provider_id;
    IF provider_user_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, body, type, metadata)
      VALUES (provider_user_id, 'Customer payment received',
        'Advance payment confirmed — ref ' || row.reference || '. You may start the job.',
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
      'Ref ' || row.reference || ' — customer contact shared with provider',
      jsonb_build_object('booking_id', row.booking_id, 'receipt_number', receipt_num));
  END IF;

  PERFORM log_activity(auth.uid(), 'admin', 'payment_confirmed', 'payment', row.id,
    'Confirmed ' || row.payment_kind || ' — ref ' || row.reference || ' ($' || row.amount || ')',
    jsonb_build_object('payment_id', row.id, 'booking_id', row.booking_id, 'kind', row.payment_kind));

  PERFORM log_audit_action('confirm_payment', 'payment', row.id,
    jsonb_build_object('booking_id', row.booking_id, 'reference', row.reference, 'kind', row.payment_kind));

  RETURN row;
END;
$$;

-- ─── Customer receipt on job complete ────────────────────────────────────────

CREATE OR REPLACE FUNCTION generate_customer_receipt_on_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  receipt_num TEXT;
  service_name TEXT;
  provider_name TEXT;
  paid_amount NUMERIC;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed' THEN
    SELECT s.name INTO service_name FROM services s WHERE s.id = NEW.service_id;
    SELECT p.business_name INTO provider_name FROM providers p WHERE p.id = NEW.provider_id;

    SELECT amount INTO paid_amount FROM payments
    WHERE booking_id = NEW.id AND payment_kind = 'customer_advance' AND status = 'paid'
    LIMIT 1;

    IF paid_amount IS NULL THEN paid_amount := COALESCE(NEW.total_price, 0); END IF;

    receipt_num := nexo_receipt_number(NEW.id, 'C');
    INSERT INTO receipts (booking_id, recipient_id, recipient_role, receipt_number, amount, payment_method, details)
    VALUES (
      NEW.id, NEW.customer_id, 'customer', receipt_num, paid_amount, NEW.payment_method,
      jsonb_build_object(
        'service_name', service_name, 'provider_name', provider_name,
        'scheduled_at', NEW.scheduled_at, 'address', NEW.address_line1,
        'postal_code', NEW.postal_code, 'type', 'service_completion_receipt'
      )
    ) ON CONFLICT (receipt_number) DO NOTHING;

    INSERT INTO notifications (user_id, title, body, type, metadata)
    VALUES (
      NEW.customer_id, 'Service receipt',
      'Receipt ' || receipt_num || ' for ' || COALESCE(service_name, 'your service') ||
        ' with ' || COALESCE(provider_name, 'provider') || '.',
      'system',
      jsonb_build_object('booking_id', NEW.id, 'receipt_number', receipt_num)
    );

    PERFORM log_activity(auth.uid(), 'provider', 'receipt_issued', 'receipt', NEW.id,
      'Customer receipt ' || receipt_num || ' for completed service',
      jsonb_build_object('booking_id', NEW.id, 'receipt_number', receipt_num));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_generate_receipt ON bookings;
CREATE TRIGGER bookings_generate_receipt
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW EXECUTE FUNCTION generate_customer_receipt_on_complete();

-- ─── RLS updates ─────────────────────────────────────────────────────────────

ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "receipts_select" ON receipts FOR SELECT USING (
  recipient_id = auth.uid()
  OR EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND b.customer_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM bookings b JOIN providers p ON p.id = b.provider_id
    WHERE b.id = booking_id AND p.user_id = auth.uid()
  )
  OR is_admin()
);

DROP POLICY IF EXISTS "bookings_select" ON bookings;
CREATE POLICY "bookings_select" ON bookings FOR SELECT USING (
  customer_id = auth.uid()
  OR EXISTS (SELECT 1 FROM providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
  OR (
    provider_id IS NULL AND status = 'pending'
    AND EXISTS (
      SELECT 1 FROM provider_services ps
      JOIN providers p ON p.id = ps.provider_id AND p.user_id = auth.uid()
      WHERE ps.service_id = bookings.service_id
    )
  )
  OR is_admin()
);

DROP POLICY IF EXISTS "payments_select" ON payments;
CREATE POLICY "payments_select" ON payments FOR SELECT USING (
  customer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM bookings b JOIN providers p ON p.id = b.provider_id
    WHERE b.id = booking_id AND p.user_id = auth.uid()
  )
  OR is_admin()
);
