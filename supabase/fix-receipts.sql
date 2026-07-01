-- Fix: "Could not find the table 'public.receipts' in the schema cache"
-- Run in Supabase SQL Editor after schema.sql (+ add-payments.sql recommended).
-- Safe to re-run.

-- Enum used by receipts.payment_method
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_payment_method') THEN
    CREATE TYPE booking_payment_method AS ENUM ('paynow', 'cash');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION nexo_receipt_number(p_booking_id UUID, p_suffix TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 'RCP-' || UPPER(SUBSTRING(REPLACE(p_booking_id::TEXT, '-', ''), 1, 8)) || '-' || p_suffix;
$$;

CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_role user_role NOT NULL,
  receipt_number TEXT NOT NULL UNIQUE,
  amount NUMERIC(10,2) NOT NULL,
  payment_method booking_payment_method NOT NULL DEFAULT 'paynow',
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_receipts_booking ON receipts(booking_id);
CREATE INDEX IF NOT EXISTS idx_receipts_recipient ON receipts(recipient_id);

-- Issue customer receipt when booking marked completed
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
  booking_payment booking_payment_method;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed' THEN
    booking_payment := COALESCE(NEW.payment_method, 'paynow'::booking_payment_method);

    SELECT s.name INTO service_name FROM services s WHERE s.id = NEW.service_id;
    SELECT p.business_name INTO provider_name FROM providers p WHERE p.id = NEW.provider_id;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'payment_kind'
    ) THEN
      SELECT amount INTO paid_amount FROM payments
      WHERE booking_id = NEW.id AND payment_kind = 'customer_advance' AND status = 'paid'
      LIMIT 1;
    ELSE
      SELECT amount INTO paid_amount FROM payments
      WHERE booking_id = NEW.id AND status = 'paid'
      LIMIT 1;
    END IF;

    IF paid_amount IS NULL THEN paid_amount := COALESCE(NEW.total_price, 0); END IF;

    receipt_num := nexo_receipt_number(NEW.id, 'C');
    INSERT INTO receipts (booking_id, recipient_id, recipient_role, receipt_number, amount, payment_method, details)
    VALUES (
      NEW.id, NEW.customer_id, 'customer', receipt_num, paid_amount, booking_payment,
      jsonb_build_object(
        'service_name', service_name,
        'provider_name', provider_name,
        'scheduled_at', NEW.scheduled_at,
        'address', NEW.address_line1,
        'postal_code', NEW.postal_code,
        'type', 'service_completion_receipt'
      )
    ) ON CONFLICT (receipt_number) DO NOTHING;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
      INSERT INTO notifications (user_id, title, body, type, metadata)
      VALUES (
        NEW.customer_id,
        'Service receipt',
        'Receipt ' || receipt_num || ' for ' || COALESCE(service_name, 'your service') ||
          ' with ' || COALESCE(provider_name, 'provider') || '.',
        'system',
        jsonb_build_object('booking_id', NEW.id, 'receipt_number', receipt_num)
      );
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_activity') THEN
      PERFORM log_activity(auth.uid(), 'provider', 'receipt_issued', 'receipt', NEW.id,
        'Customer receipt ' || receipt_num || ' for completed service',
        jsonb_build_object('booking_id', NEW.id, 'receipt_number', receipt_num));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_generate_receipt ON bookings;
CREATE TRIGGER bookings_generate_receipt
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW EXECUTE FUNCTION generate_customer_receipt_on_complete();

ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "receipts_select" ON receipts;
CREATE POLICY "receipts_select" ON receipts FOR SELECT USING (
  recipient_id = auth.uid()
  OR EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND b.customer_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM bookings b
    JOIN providers p ON p.id = b.provider_id
    WHERE b.id = booking_id AND p.user_id = auth.uid()
  )
  OR is_admin()
);

-- Reload PostgREST schema cache
DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION
  WHEN others THEN NULL;
END $$;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'receipts'
ORDER BY ordinal_position;
