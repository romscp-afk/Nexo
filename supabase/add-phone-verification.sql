-- WhatsApp phone verification for registration
-- Run in Supabase SQL Editor after schema.sql

CREATE TABLE IF NOT EXISTS phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_e164 TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone_created
  ON phone_verifications (phone_e164, created_at DESC);

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;

-- Edge functions use service role; block anon/authenticated direct access
ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;

-- Replace handle_new_user to mark phone verified when registration includes verification id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role user_role;
  meta_role TEXT;
  verification_id UUID;
  normalized_phone TEXT;
  v_record phone_verifications%ROWTYPE;
BEGIN
  meta_role := NEW.raw_user_meta_data->>'role';
  verification_id := NULLIF(NEW.raw_user_meta_data->>'phone_verification_id', '')::UUID;
  normalized_phone := NULLIF(trim(NEW.raw_user_meta_data->>'phone'), '');

  IF NEW.email = ANY(nexo_admin_emails()) THEN
    assigned_role := 'admin';
  ELSIF meta_role IN ('customer', 'provider', 'admin') THEN
    assigned_role := meta_role::user_role;
  ELSE
    assigned_role := 'customer';
  END IF;

  -- All self-registered customers/providers must verify phone via WhatsApp first
  IF assigned_role IN ('customer', 'provider') THEN
    IF verification_id IS NULL OR normalized_phone IS NULL THEN
      RAISE EXCEPTION 'Phone WhatsApp verification is required before registration';
    END IF;

    SELECT * INTO v_record
    FROM phone_verifications
    WHERE id = verification_id
      AND phone_e164 = normalized_phone
      AND verified_at IS NOT NULL
      AND consumed_at IS NULL
      AND expires_at > now()
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invalid or expired phone verification. Request a new WhatsApp code.';
    END IF;

    UPDATE phone_verifications
    SET consumed_at = now()
    WHERE id = verification_id;
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
    assigned_role IN ('customer', 'provider'),
    CASE WHEN assigned_role IN ('customer', 'provider') THEN now() ELSE NULL END
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
