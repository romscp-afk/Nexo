-- Fix signup 500 / "{}" auth error — run in Supabase SQL Editor if signup fails

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role user_role;
  meta_role TEXT;
BEGIN
  meta_role := NEW.raw_user_meta_data->>'role';

  IF NEW.email = ANY(nexo_admin_emails()) THEN
    assigned_role := 'admin';
  ELSIF meta_role IN ('customer', 'provider', 'admin') THEN
    assigned_role := meta_role::user_role;
  ELSE
    assigned_role := 'customer';
  END IF;

  INSERT INTO profiles (user_id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    assigned_role
  );

  IF assigned_role = 'provider' THEN
    INSERT INTO providers (user_id, business_name)
    VALUES (
      NEW.id,
      COALESCE(
        NEW.raw_user_meta_data->>'business_name',
        NEW.raw_user_meta_data->>'full_name',
        'My Business'
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Allow Supabase Auth to invoke the trigger function
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION handle_new_user() TO supabase_auth_admin;

-- Ensure auth admin can write profile rows created by the trigger
GRANT INSERT ON public.profiles TO supabase_auth_admin;
GRANT INSERT ON public.providers TO supabase_auth_admin;
