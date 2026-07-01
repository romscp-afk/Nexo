-- PayNow advance payments + activity log — run after schema.sql
-- PayNow recipient: +6587877525

CREATE TYPE payment_status AS ENUM ('pending', 'submitted', 'paid', 'failed', 'refunded');

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'SGD',
  status payment_status NOT NULL DEFAULT 'pending',
  method TEXT NOT NULL DEFAULT 'paynow',
  paynow_mobile TEXT NOT NULL DEFAULT '+6587877525',
  reference TEXT NOT NULL UNIQUE,
  booking_details JSONB NOT NULL DEFAULT '{}',
  customer_note TEXT,
  paid_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role user_role,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  summary TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status, created_at DESC);
CREATE INDEX idx_payments_reference ON payments(reference);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Activity logging helper ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION log_activity(
  p_actor_id UUID,
  p_actor_role user_role,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_summary TEXT,
  p_details JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO activity_logs (actor_id, actor_role, action, entity_type, entity_id, summary, details)
  VALUES (p_actor_id, p_actor_role, p_action, p_entity_type, p_entity_id, p_summary, p_details)
  RETURNING id INTO log_id;
  RETURN log_id;
END;
$$;

GRANT EXECUTE ON FUNCTION log_activity(UUID, user_role, TEXT, TEXT, UUID, TEXT, JSONB) TO authenticated;

-- ─── Payment reference helper ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION nexo_payment_reference(p_booking_id UUID)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 'NEXO-' || UPPER(SUBSTRING(REPLACE(p_booking_id::TEXT, '-', ''), 1, 8));
$$;

-- ─── Create payment when booking confirmed ───────────────────────────────────

CREATE OR REPLACE FUNCTION create_payment_on_booking_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payment_ref TEXT;
  provider_name TEXT;
  service_name TEXT;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'confirmed' THEN
    payment_ref := nexo_payment_reference(NEW.id);

    SELECT p.business_name INTO provider_name FROM providers p WHERE p.id = NEW.provider_id;
    SELECT s.name INTO service_name FROM services s WHERE s.id = NEW.service_id;

    INSERT INTO payments (
      booking_id, customer_id, amount, paynow_mobile, reference, booking_details
    ) VALUES (
      NEW.id,
      NEW.customer_id,
      COALESCE(NEW.total_price, 0),
      '+6587877525',
      payment_ref,
      jsonb_build_object(
        'booking_id', NEW.id,
        'reference', payment_ref,
        'service_name', service_name,
        'provider_name', provider_name,
        'scheduled_at', NEW.scheduled_at,
        'address_line1', NEW.address_line1,
        'address_line2', NEW.address_line2,
        'postal_code', NEW.postal_code,
        'total_price', NEW.total_price
      )
    )
    ON CONFLICT (booking_id) DO NOTHING;

    PERFORM log_activity(
      auth.uid(),
      COALESCE((SELECT role FROM profiles WHERE user_id = auth.uid()), 'provider'::user_role),
      'payment_created',
      'payment',
      NEW.id,
      'PayNow payment requested for booking ' || payment_ref,
      jsonb_build_object('booking_id', NEW.id, 'reference', payment_ref, 'amount', NEW.total_price)
    );

    INSERT INTO notifications (user_id, title, body, type, metadata)
    VALUES (
      NEW.customer_id,
      'Pay in advance via PayNow',
      'Your booking is confirmed. Scan the PayNow QR on the booking page and pay ' ||
        COALESCE(NEW.total_price::TEXT, '0') || ' SGD. Ref: ' || payment_ref,
      'booking',
      jsonb_build_object('booking_id', NEW.id, 'payment_reference', payment_ref, 'action', 'paynow')
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER bookings_create_payment_on_confirm
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW EXECUTE FUNCTION create_payment_on_booking_confirmed();

-- ─── Block job start until payment received ──────────────────────────────────

CREATE OR REPLACE FUNCTION enforce_payment_before_start()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = 'confirmed' AND NEW.status = 'in_progress' THEN
    IF NOT EXISTS (
      SELECT 1 FROM payments WHERE booking_id = NEW.id AND status = 'paid'
    ) THEN
      RAISE EXCEPTION 'Advance PayNow payment must be confirmed before starting the job';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER bookings_enforce_payment_before_start
  BEFORE UPDATE OF status ON bookings
  FOR EACH ROW EXECUTE FUNCTION enforce_payment_before_start();

-- ─── Log booking status changes to activity log ──────────────────────────────

CREATE OR REPLACE FUNCTION log_booking_status_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_role user_role;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    actor_role := COALESCE((SELECT role FROM profiles WHERE user_id = auth.uid()), 'customer'::user_role);

    PERFORM log_activity(
      auth.uid(),
      actor_role,
      'booking_status_changed',
      'booking',
      NEW.id,
      'Booking ' || nexo_payment_reference(NEW.id) || ': ' || OLD.status || ' → ' || NEW.status,
      jsonb_build_object(
        'booking_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER bookings_log_status_activity
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW EXECUTE FUNCTION log_booking_status_activity();

-- ─── Customer: mark payment submitted ────────────────────────────────────────

CREATE OR REPLACE FUNCTION customer_submit_payment(
  p_payment_id UUID,
  p_note TEXT DEFAULT NULL
)
RETURNS payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row payments;
BEGIN
  UPDATE payments
  SET status = 'submitted', customer_note = p_note, updated_at = now()
  WHERE id = p_payment_id
    AND customer_id = auth.uid()
    AND status = 'pending'
  RETURNING * INTO row;

  IF row.id IS NULL THEN
    RAISE EXCEPTION 'Payment not found or already submitted';
  END IF;

  PERFORM log_activity(
    auth.uid(),
    'customer',
    'payment_submitted',
    'payment',
    row.id,
    'Customer marked PayNow sent — ref ' || row.reference,
    jsonb_build_object('payment_id', row.id, 'booking_id', row.booking_id, 'reference', row.reference, 'note', p_note)
  );

  INSERT INTO notifications (user_id, title, body, type, metadata)
  SELECT p.user_id, 'Payment submitted for review', 'Ref ' || row.reference || ' — customer marked PayNow as sent.',
    'system', jsonb_build_object('payment_id', row.id, 'booking_id', row.booking_id, 'reference', row.reference)
  FROM profiles p WHERE p.role = 'admin';

  RETURN row;
END;
$$;

GRANT EXECUTE ON FUNCTION customer_submit_payment(UUID, TEXT) TO authenticated;

-- ─── Admin: confirm payment received ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION admin_confirm_payment(p_payment_id UUID)
RETURNS payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row payments;
  provider_user_id UUID;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can confirm payments';
  END IF;

  UPDATE payments
  SET status = 'paid', paid_at = now(), confirmed_by = auth.uid(), updated_at = now()
  WHERE id = p_payment_id
    AND status IN ('pending', 'submitted')
  RETURNING * INTO row;

  IF row.id IS NULL THEN
    RAISE EXCEPTION 'Payment not found or already confirmed';
  END IF;

  PERFORM log_activity(
    auth.uid(),
    'admin',
    'payment_confirmed',
    'payment',
    row.id,
    'Admin confirmed PayNow received — ref ' || row.reference || ' ($' || row.amount || ')',
    jsonb_build_object('payment_id', row.id, 'booking_id', row.booking_id, 'reference', row.reference, 'amount', row.amount)
  );

  PERFORM log_audit_action(
    'confirm_payment',
    'payment',
    row.id,
    jsonb_build_object('booking_id', row.booking_id, 'reference', row.reference, 'amount', row.amount)
  );

  INSERT INTO notifications (user_id, title, body, type, metadata)
  VALUES (
    row.customer_id,
    'Payment confirmed',
    'Your PayNow payment (ref ' || row.reference || ') was verified. The provider can now start your job.',
    'booking',
    jsonb_build_object('booking_id', row.booking_id, 'payment_id', row.id, 'reference', row.reference)
  );

  SELECT pr.user_id INTO provider_user_id
  FROM bookings b JOIN providers pr ON pr.id = b.provider_id
  WHERE b.id = row.booking_id;

  IF provider_user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, body, type, metadata)
    VALUES (
      provider_user_id,
      'Payment received',
      'Advance payment confirmed for ref ' || row.reference || '. You may start the job.',
      'booking',
      jsonb_build_object('booking_id', row.booking_id, 'payment_id', row.id, 'reference', row.reference)
    );
  END IF;

  RETURN row;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_confirm_payment(UUID) TO authenticated;

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select" ON payments FOR SELECT USING (
  customer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM bookings b
    JOIN providers p ON p.id = b.provider_id
    WHERE b.id = booking_id AND p.user_id = auth.uid()
  )
  OR is_admin()
);

CREATE POLICY "payments_admin_all" ON payments FOR ALL USING (is_admin());

CREATE POLICY "activity_logs_select_admin" ON activity_logs FOR SELECT USING (is_admin());
