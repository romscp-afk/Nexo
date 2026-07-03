-- Fix admin login — paste ALL into Supabase SQL Editor and click Run.
-- Login: romscp@gmail.com / Test@123
-- Prerequisite: run schema.sql first (profiles table must exist).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION nexo_admin_emails()
RETURNS TEXT[] AS $$
  SELECT ARRAY['romscp@gmail.com']::TEXT[];
$$ LANGUAGE sql IMMUTABLE;

DO $$
DECLARE
  inst_id UUID;
  admin_email TEXT := 'romscp@gmail.com';
  admin_password TEXT := 'Test@123';
  default_admin_id UUID := 'a9999999-9999-9999-9999-999999999901'::UUID;
  v_uid UUID;
  encrypted_pw TEXT;
  has_provider_id_col BOOLEAN;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    RAISE EXCEPTION 'Missing public.profiles — run supabase/schema.sql first, then run this script again.';
  END IF;

  SELECT COALESCE(
    (SELECT instance_id FROM auth.users LIMIT 1),
    '00000000-0000-0000-0000-000000000000'::UUID
  ) INTO inst_id;

  encrypted_pw := crypt(admin_password, gen_salt('bf'));

  SELECT id INTO v_uid FROM auth.users WHERE lower(email) = lower(admin_email) LIMIT 1;

  -- Reuse the seeded admin row if the email changed (e.g. romalgk → romscp).
  IF v_uid IS NULL THEN
    SELECT id INTO v_uid FROM auth.users WHERE id = default_admin_id LIMIT 1;
  END IF;

  IF v_uid IS NULL THEN
    v_uid := default_admin_id;

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      inst_id, v_uid, 'authenticated', 'authenticated',
      admin_email, encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"admin","full_name":"Romal Admin","phone":"87877525"}',
      now(), now(), '', '', '', ''
    );
  ELSE
    UPDATE auth.users SET
      email = admin_email,
      encrypted_password = encrypted_pw,
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      confirmation_token = COALESCE(confirmation_token, ''),
      email_change = COALESCE(email_change, ''),
      email_change_token_new = COALESCE(email_change_token_new, ''),
      recovery_token = COALESCE(recovery_token, ''),
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
        || '{"role":"admin","full_name":"Romal Admin","phone":"87877525"}'::jsonb,
      updated_at = now()
    WHERE id = v_uid;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'identities' AND column_name = 'provider_id'
  ) INTO has_provider_id_col;

  DELETE FROM auth.identities WHERE user_id = v_uid;
  DELETE FROM auth.identities
  WHERE provider = 'email' AND provider_id::text = v_uid::text;

  IF has_provider_id_col THEN
    INSERT INTO auth.identities (
      user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_uid,
      v_uid::text,
      jsonb_build_object('sub', v_uid::text, 'email', admin_email),
      'email',
      now(), now(), now()
    );
  ELSE
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_uid,
      v_uid,
      jsonb_build_object('sub', v_uid::text, 'email', admin_email),
      'email',
      v_uid::text,
      now(), now(), now()
    );
  END IF;

  INSERT INTO profiles (user_id, email, full_name, phone, role)
  VALUES (v_uid, admin_email, 'Romal Admin', '87877525', 'admin')
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    role = 'admin';

  RAISE NOTICE 'Admin ready: % / % (user_id=%)', admin_email, admin_password, v_uid;
END $$;

SELECT 'auth.users' AS step, id::text AS user_id, email, email_confirmed_at IS NOT NULL AS confirmed
FROM auth.users WHERE lower(email) = 'romscp@gmail.com';

SELECT 'profiles' AS step, user_id::text, email, role
FROM profiles WHERE lower(email) = 'romscp@gmail.com';
