-- Safe fix for: "Could not find the 'payment_method' column of 'bookings'"
-- Run in Supabase SQL Editor (safe to re-run).
--
-- If this still errors, run ONLY "PART 1" first, then PART 2 if payments table exists.

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 1 — bookings columns (fixes admin payments page schema cache error)
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_payment_method') THEN
    CREATE TYPE booking_payment_method AS ENUM ('paynow', 'cash');
  END IF;
END $$;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method booking_payment_method;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS admin_fee NUMERIC(10,2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_contact_shared BOOLEAN;

UPDATE bookings SET payment_method = 'paynow' WHERE payment_method IS NULL;
UPDATE bookings SET admin_fee = 25 WHERE admin_fee IS NULL;
UPDATE bookings SET customer_contact_shared = false WHERE customer_contact_shared IS NULL;

ALTER TABLE bookings ALTER COLUMN payment_method SET DEFAULT 'paynow';
ALTER TABLE bookings ALTER COLUMN payment_method SET NOT NULL;
ALTER TABLE bookings ALTER COLUMN admin_fee SET DEFAULT 25;
ALTER TABLE bookings ALTER COLUMN admin_fee SET NOT NULL;
ALTER TABLE bookings ALTER COLUMN customer_contact_shared SET DEFAULT false;
ALTER TABLE bookings ALTER COLUMN customer_contact_shared SET NOT NULL;

-- Nullable provider for open category requests (ignore if already nullable)
DO $$
BEGIN
  ALTER TABLE bookings ALTER COLUMN provider_id DROP NOT NULL;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 2 — payments.payment_kind (skip if payments table not created yet)
-- Run add-payments.sql first if PART 2 is skipped automatically
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'payments'
  ) THEN
    RAISE NOTICE 'payments table not found — run supabase/add-payments.sql, then re-run this script for PART 2.';
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_kind') THEN
    CREATE TYPE payment_kind AS ENUM ('customer_advance', 'provider_admin_fee');
  END IF;

  ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_kind payment_kind;

  UPDATE payments SET payment_kind = 'customer_advance' WHERE payment_kind IS NULL;

  ALTER TABLE payments ALTER COLUMN payment_kind SET DEFAULT 'customer_advance';
  ALTER TABLE payments ALTER COLUMN payment_kind SET NOT NULL;

  -- Drop old one-payment-per-booking unique constraint (name varies)
  ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_booking_id_key;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'payments_booking_kind_unique'
  ) THEN
    CREATE UNIQUE INDEX payments_booking_kind_unique ON payments (booking_id, payment_kind);
  END IF;
END $$;

-- Refresh PostgREST schema cache (ignore if NOTIFY unavailable)
DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION
  WHEN others THEN NULL;
END $$;
