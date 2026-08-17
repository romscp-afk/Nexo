-- Fix: column "payment_kind" of relation "payments" does not exist
-- when provider accepts a booking (create_payment_on_booking_confirmed trigger).
-- Safe to re-run.

-- ─── payment_kind column on payments ─────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'payments'
  ) THEN
    RAISE EXCEPTION 'payments table not found — run supabase/add-payments.sql first';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_kind') THEN
    CREATE TYPE payment_kind AS ENUM ('customer_advance', 'provider_admin_fee');
  END IF;

  ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_kind payment_kind;

  UPDATE payments SET payment_kind = 'customer_advance' WHERE payment_kind IS NULL;

  ALTER TABLE payments ALTER COLUMN payment_kind SET DEFAULT 'customer_advance';
  ALTER TABLE payments ALTER COLUMN payment_kind SET NOT NULL;

  ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_booking_id_key;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'payments_booking_kind_unique'
  ) THEN
    CREATE UNIQUE INDEX payments_booking_kind_unique ON payments (booking_id, payment_kind);
  END IF;
END $$;

-- ─── Payment on confirm (uses payment_kind + notification_type cast) ─────────

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
        'booking'::notification_type,
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
        'booking'::notification_type,
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

DROP TRIGGER IF EXISTS bookings_create_payment_on_confirm ON bookings;
CREATE TRIGGER bookings_create_payment_on_confirm
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION create_payment_on_booking_confirmed();

DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION
  WHEN others THEN NULL;
END $$;
