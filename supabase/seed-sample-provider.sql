-- Single sample provider for quick testing — run after schema.sql + seed.sql
-- Login: provider.demo@nexo.sg / Demo1234!
-- Opens provider portal at /provider

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  inst_id UUID;
  provider_user_id UUID := 'a7777777-7777-7777-7777-777777777701'::UUID;
BEGIN
  SELECT COALESCE(
    (SELECT instance_id FROM auth.users LIMIT 1),
    '00000000-0000-0000-0000-000000000000'::UUID
  ) INTO inst_id;

  DELETE FROM provider_services WHERE provider_id IN (
    SELECT id FROM providers WHERE user_id = provider_user_id
  );
  DELETE FROM providers WHERE user_id = provider_user_id;
  DELETE FROM profiles WHERE user_id = provider_user_id;
  DELETE FROM auth.identities WHERE user_id = provider_user_id;
  DELETE FROM auth.users WHERE id = provider_user_id;

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    inst_id, provider_user_id, 'authenticated', 'authenticated',
    'provider.demo@nexo.sg', crypt('Demo1234!', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"provider","full_name":"Sam Ng","phone":"98765432","business_name":"SparkClean Demo","bio":"Sample provider account for testing bookings, profile, and pricing in the Nexo provider portal.","years_experience":"4","hourly_rate":"40","service_areas":"Tampines,Bedok,Simei"}',
    now(), now(), '', '', '', ''
  );

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(), provider_user_id,
    jsonb_build_object('sub', provider_user_id, 'email', 'provider.demo@nexo.sg'),
    'email', provider_user_id::TEXT, now(), now(), now()
  );
END $$;

INSERT INTO profiles (user_id, email, full_name, phone, role)
VALUES (
  'a7777777-7777-7777-7777-777777777701',
  'provider.demo@nexo.sg',
  'Sam Ng',
  '98765432',
  'provider'
)
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role;

INSERT INTO providers (
  user_id, business_name, bio, years_experience, hourly_rate, service_areas,
  is_verified, is_active, rating_avg, rating_count
)
VALUES (
  'a7777777-7777-7777-7777-777777777701',
  'SparkClean Demo',
  'Sample provider account for testing bookings, profile, and pricing in the Nexo provider portal.',
  4,
  40,
  ARRAY['Tampines', 'Bedok', 'Simei'],
  true,
  true,
  4.7,
  12
)
ON CONFLICT (user_id) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  bio = EXCLUDED.bio,
  years_experience = EXCLUDED.years_experience,
  hourly_rate = EXCLUDED.hourly_rate,
  service_areas = EXCLUDED.service_areas,
  is_verified = true,
  is_active = true,
  rating_avg = EXCLUDED.rating_avg,
  rating_count = EXCLUDED.rating_count;

INSERT INTO provider_services (provider_id, service_id, price_from, description)
SELECT p.id, s.id, 42::NUMERIC, 'Demo cleaning — 2-room HDB from $42'
FROM providers p
JOIN services s ON s.slug = 'cleaning-standard'
WHERE p.user_id = 'a7777777-7777-7777-7777-777777777701'
ON CONFLICT (provider_id, service_id) DO UPDATE SET
  price_from = EXCLUDED.price_from,
  description = EXCLUDED.description;
