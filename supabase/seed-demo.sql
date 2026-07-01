-- Nexo demo accounts — run after schema.sql + seed.sql in Supabase SQL Editor
-- All demo passwords: Demo1234!

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Fixed UUIDs so re-runs are predictable
-- customer.demo@nexo.sg     → a1111111-1111-1111-1111-111111111101
-- cleanpro@nexo.sg          → a2222222-2222-2222-2222-222222222201
-- handyman.sg@nexo.sg       → a3333333-3333-3333-3333-333333333301
-- aircool@nexo.sg           → a4444444-4444-4444-4444-444444444401

DO $$
DECLARE
  inst_id UUID;
BEGIN
  SELECT COALESCE(
    (SELECT instance_id FROM auth.users LIMIT 1),
    '00000000-0000-0000-0000-000000000000'::UUID
  ) INTO inst_id;

  -- Remove previous demo rows (safe re-run)
  DELETE FROM provider_services WHERE provider_id IN (
    SELECT id FROM providers WHERE user_id IN (
      'a2222222-2222-2222-2222-222222222201'::UUID,
      'a3333333-3333-3333-3333-333333333301'::UUID,
      'a4444444-4444-4444-4444-444444444401'::UUID
    )
  );
  DELETE FROM providers WHERE user_id IN (
    'a2222222-2222-2222-2222-222222222201'::UUID,
    'a3333333-3333-3333-3333-333333333301'::UUID,
    'a4444444-4444-4444-4444-444444444401'::UUID
  );
  DELETE FROM profiles WHERE user_id IN (
    'a1111111-1111-1111-1111-111111111101'::UUID,
    'a2222222-2222-2222-2222-222222222201'::UUID,
    'a3333333-3333-3333-3333-333333333301'::UUID,
    'a4444444-4444-4444-4444-444444444401'::UUID
  );
  DELETE FROM auth.identities WHERE user_id IN (
    'a1111111-1111-1111-1111-111111111101'::UUID,
    'a2222222-2222-2222-2222-222222222201'::UUID,
    'a3333333-3333-3333-3333-333333333301'::UUID,
    'a4444444-4444-4444-4444-444444444401'::UUID
  );
  DELETE FROM auth.users WHERE id IN (
    'a1111111-1111-1111-1111-111111111101'::UUID,
    'a2222222-2222-2222-2222-222222222201'::UUID,
    'a3333333-3333-3333-3333-333333333301'::UUID,
    'a4444444-4444-4444-4444-444444444401'::UUID
  );

  -- Demo customer
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    inst_id,
    'a1111111-1111-1111-1111-111111111101',
    'authenticated', 'authenticated',
    'customer.demo@nexo.sg',
    crypt('Demo1234!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"customer","full_name":"Alex Tan","phone":"91234567","address_line1":"Blk 123 Tampines Street 11","address_line2":"#08-456","postal_code":"521123","preferred_area":"Tampines"}',
    now(), now(), '', '', '', ''
  );

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'a1111111-1111-1111-1111-111111111101',
    jsonb_build_object('sub', 'a1111111-1111-1111-1111-111111111101', 'email', 'customer.demo@nexo.sg'),
    'email', 'a1111111-1111-1111-1111-111111111101', now(), now(), now()
  );

  -- CleanPro — East region cleaning
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    inst_id,
    'a2222222-2222-2222-2222-222222222201',
    'authenticated', 'authenticated',
    'cleanpro@nexo.sg',
    crypt('Demo1234!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"provider","full_name":"Sarah Lim","phone":"92345678","business_name":"CleanPro SG","bio":"Reliable home cleaning for HDB and condos. Eco-friendly products available.","years_experience":"5","hourly_rate":"35","service_areas":"Tampines,Bedok,Pasir Ris,Simei"}',
    now(), now(), '', '', '', ''
  );

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'a2222222-2222-2222-2222-222222222201',
    jsonb_build_object('sub', 'a2222222-2222-2222-2222-222222222201', 'email', 'cleanpro@nexo.sg'),
    'email', 'a2222222-2222-2222-2222-222222222201', now(), now(), now()
  );

  -- FixIt — handyman West/Central
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    inst_id,
    'a3333333-3333-3333-3333-333333333301',
    'authenticated', 'authenticated',
    'handyman.sg@nexo.sg',
    crypt('Demo1234!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"provider","full_name":"Raj Kumar","phone":"93456789","business_name":"FixIt Handyman","bio":"Drilling, mounting, minor repairs and furniture assembly across the island.","years_experience":"8","hourly_rate":"55","service_areas":"Jurong East,Clementi,Bukit Batok,CBD"}',
    now(), now(), '', '', '', ''
  );

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'a3333333-3333-3333-3333-333333333301',
    jsonb_build_object('sub', 'a3333333-3333-3333-3333-333333333301', 'email', 'handyman.sg@nexo.sg'),
    'email', 'a3333333-3333-3333-3333-333333333301', now(), now(), now()
  );

  -- CoolAir — aircon islandwide
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    inst_id,
    'a4444444-4444-4444-4444-444444444401',
    'authenticated', 'authenticated',
    'aircool@nexo.sg',
    crypt('Demo1234!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"provider","full_name":"Michelle Ong","phone":"94567890","business_name":"CoolAir Services","bio":"Licensed aircon servicing, chemical wash and gas top-up. Same-week slots available.","years_experience":"10","hourly_rate":"45","service_areas":"Ang Mo Kio,Bishan,Toa Payoh,Woodlands,Yishun"}',
    now(), now(), '', '', '', ''
  );

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'a4444444-4444-4444-4444-444444444401',
    jsonb_build_object('sub', 'a4444444-4444-4444-4444-444444444401', 'email', 'aircool@nexo.sg'),
    'email', 'a4444444-4444-4444-4444-444444444401', now(), now(), now()
  );
END $$;

-- Mark demo providers verified with sample ratings
UPDATE providers SET
  is_verified = true,
  rating_avg = 4.8,
  rating_count = 24,
  bio = COALESCE(bio, 'Trusted Nexo demo provider'),
  years_experience = GREATEST(years_experience, 3),
  hourly_rate = GREATEST(hourly_rate, 30)
WHERE user_id IN (
  'a2222222-2222-2222-2222-222222222201',
  'a3333333-3333-3333-3333-333333333301',
  'a4444444-4444-4444-4444-444444444401'
);

UPDATE providers SET rating_avg = 4.6, rating_count = 18
WHERE user_id = 'a3333333-3333-3333-3333-333333333301';

UPDATE providers SET rating_avg = 4.9, rating_count = 31
WHERE user_id = 'a4444444-4444-4444-4444-444444444401';

-- Service pricing per provider
INSERT INTO provider_services (provider_id, service_id, price_from, description)
SELECT p.id, s.id, prices.price_from, prices.description
FROM (VALUES
  ('a2222222-2222-2222-2222-222222222201'::UUID, 'cleaning-standard', 45::NUMERIC, '2-room HDB from $45'),
  ('a3333333-3333-3333-3333-333333333301'::UUID, 'handyman-standard', 65::NUMERIC, 'First hour incl. basic tools'),
  ('a4444444-4444-4444-4444-444444444401'::UUID, 'aircon-standard', 50::NUMERIC, 'Per unit general servicing')
) AS prices(user_id, service_slug, price_from, description)
JOIN providers p ON p.user_id = prices.user_id
JOIN services s ON s.slug = prices.service_slug
ON CONFLICT (provider_id, service_id) DO UPDATE
SET price_from = EXCLUDED.price_from, description = EXCLUDED.description;

-- Ensure customer profile has location (trigger should set this; belt-and-braces)
UPDATE profiles SET
  full_name = 'Alex Tan',
  phone = '91234567',
  address_line1 = 'Blk 123 Tampines Street 11',
  address_line2 = '#08-456',
  postal_code = '521123',
  preferred_area = 'Tampines'
WHERE user_id = 'a1111111-1111-1111-1111-111111111101';
