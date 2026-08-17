-- Update platform fee to SGD 5 (safe to re-run).

CREATE OR REPLACE FUNCTION nexo_platform_fee()
RETURNS NUMERIC AS $$
  SELECT 5::NUMERIC;
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION nexo_admin_fee()
RETURNS NUMERIC AS $$
  SELECT nexo_platform_fee();
$$ LANGUAGE sql IMMUTABLE;

ALTER TABLE bookings ALTER COLUMN platform_fee SET DEFAULT 5;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'admin_fee'
  ) THEN
    ALTER TABLE bookings ALTER COLUMN admin_fee SET DEFAULT 5;
  END IF;
END $$;

DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION
  WHEN others THEN NULL;
END $$;
