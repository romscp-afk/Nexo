-- Run this in Supabase SQL Editor, then wait 30s and hard-refresh the app.
-- Verifies the column exists and forces PostgREST to reload its schema cache.

-- 1) Add column if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_payment_method') THEN
    CREATE TYPE booking_payment_method AS ENUM ('paynow', 'cash');
  END IF;
END $$;

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_method booking_payment_method;
UPDATE public.bookings SET payment_method = 'paynow' WHERE payment_method IS NULL;
ALTER TABLE public.bookings ALTER COLUMN payment_method SET DEFAULT 'paynow';
ALTER TABLE public.bookings ALTER COLUMN payment_method SET NOT NULL;

-- 2) Confirm it exists (you should see one row: payment_method | booking_payment_method)
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bookings'
  AND column_name = 'payment_method';

-- 3) Reload API schema cache (run both — one works depending on Supabase version)
NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');
