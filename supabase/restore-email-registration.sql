-- Restore registration without WhatsApp phone verification (email verification instead).
-- Run in Supabase SQL Editor after add-phone-verification.sql was applied.

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
GRANT INSERT ON public.profiles TO supabase_auth_admin;
GRANT INSERT ON public.providers TO supabase_auth_admin;
