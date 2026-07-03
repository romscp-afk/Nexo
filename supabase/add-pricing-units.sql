-- Unit-based pricing (aircon), platform fee SGD 3, booking quantity & breakdown
-- Run after schema.sql + add-marketplace.sql

DO $$ BEGIN
  CREATE TYPE pricing_model AS ENUM ('hourly', 'per_unit');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS pricing_model pricing_model NOT NULL DEFAULT 'hourly',
  ADD COLUMN IF NOT EXISTS unit_label TEXT;

ALTER TABLE provider_services
  ADD COLUMN IF NOT EXISTS unit_prices JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS quantity INT CHECK (quantity IS NULL OR quantity >= 1),
  ADD COLUMN IF NOT EXISTS service_subtotal NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(10,2) NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS pricing_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Platform / admin fee SGD 3
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'admin_fee'
  ) THEN
    ALTER TABLE bookings ALTER COLUMN admin_fee SET DEFAULT 3;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION nexo_platform_fee()
RETURNS NUMERIC AS $$
  SELECT 3::NUMERIC;
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION nexo_admin_fee()
RETURNS NUMERIC AS $$
  SELECT nexo_platform_fee();
$$ LANGUAGE sql IMMUTABLE;

-- Aircon uses per-unit pricing
UPDATE services SET pricing_model = 'per_unit', unit_label = 'unit'
WHERE slug = 'aircon-standard';

UPDATE services SET pricing_model = 'hourly', unit_label = NULL
WHERE slug IN ('cleaning-standard', 'handyman-standard', 'movers-standard', 'plumbing-standard');

-- Ensure nexo_admin_emails includes romscp@gmail.com (admin on any registration path)
CREATE OR REPLACE FUNCTION nexo_admin_emails()
RETURNS TEXT[] AS $$
  SELECT ARRAY['romscp@gmail.com']::TEXT[];
$$ LANGUAGE sql IMMUTABLE;

-- Re-apply registration trigger so admin role is assigned on signup (production)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role user_role;
  meta_role TEXT;
  normalized_phone TEXT;
BEGIN
  meta_role := NEW.raw_user_meta_data->>'role';
  normalized_phone := NULLIF(trim(NEW.raw_user_meta_data->>'phone'), '');

  IF NEW.email = ANY(nexo_admin_emails()) THEN
    assigned_role := 'admin';
  ELSIF meta_role IN ('customer', 'provider', 'admin') THEN
    assigned_role := meta_role::user_role;
  ELSE
    assigned_role := 'customer';
  END IF;

  INSERT INTO profiles (
    user_id, email, full_name, phone, address_line1, address_line2, postal_code,
    preferred_area, role, phone_verified, phone_verified_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    normalized_phone,
    NEW.raw_user_meta_data->>'address_line1',
    NEW.raw_user_meta_data->>'address_line2',
    NEW.raw_user_meta_data->>'postal_code',
    NEW.raw_user_meta_data->>'preferred_area',
    assigned_role,
    false,
    NULL
  );

  IF assigned_role = 'provider' THEN
    INSERT INTO providers (user_id, business_name, bio, years_experience, hourly_rate, service_areas)
    VALUES (
      NEW.id,
      COALESCE(
        NEW.raw_user_meta_data->>'business_name',
        NEW.raw_user_meta_data->>'full_name',
        'My Business'
      ),
      NEW.raw_user_meta_data->>'bio',
      COALESCE((NEW.raw_user_meta_data->>'years_experience')::INT, 0),
      COALESCE((NEW.raw_user_meta_data->>'hourly_rate')::NUMERIC, 0),
      CASE
        WHEN NEW.raw_user_meta_data->>'service_areas' IS NOT NULL
          AND NEW.raw_user_meta_data->>'service_areas' <> ''
        THEN string_to_array(NEW.raw_user_meta_data->>'service_areas', ',')
        ELSE '{}'::TEXT[]
      END
    );
  END IF;

  RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION handle_new_user() TO supabase_auth_admin;
