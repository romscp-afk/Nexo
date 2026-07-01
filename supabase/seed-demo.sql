-- Nexo demo accounts — run after schema.sql + seed.sql in Supabase SQL Editor
-- All demo passwords: Demo1234!
--
-- Accounts:
--   customer.demo@nexo.sg  — customer (Tampines)
--   cleanpro@nexo.sg       — cleaning (East, incl. Tampines)
--   handyman.sg@nexo.sg    — handyman (West/Central)
--   aircool@nexo.sg        — aircon (North/Central)
--   swiftmove@nexo.sg      — movers (East, incl. Tampines)
--   pipefix@nexo.sg        — plumbing (East/Central, incl. Tampines)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  inst_id UUID;
  demo_users UUID[] := ARRAY[
    'a1111111-1111-1111-1111-111111111101'::UUID,
    'a2222222-2222-2222-2222-222222222201'::UUID,
    'a3333333-3333-3333-3333-333333333301'::UUID,
    'a4444444-4444-4444-4444-444444444401'::UUID,
    'a5555555-5555-5555-5555-555555555501'::UUID,
    'a6666666-6666-6666-6666-666666666601'::UUID
  ];
  demo_bookings UUID[] := ARRAY[
    'b1111111-1111-1111-1111-111111111101'::UUID,
    'b2222222-2222-2222-2222-222222222201'::UUID,
    'b3333333-3333-3333-3333-333333333301'::UUID
  ];
BEGIN
  SELECT COALESCE(
    (SELECT instance_id FROM auth.users LIMIT 1),
    '00000000-0000-0000-0000-000000000000'::UUID
  ) INTO inst_id;

  DELETE FROM reviews WHERE booking_id = ANY(demo_bookings);
  DELETE FROM booking_status_history WHERE booking_id = ANY(demo_bookings);
  DELETE FROM bookings WHERE id = ANY(demo_bookings);
  DELETE FROM notifications WHERE user_id = ANY(demo_users);

  DELETE FROM provider_services WHERE provider_id IN (
    SELECT id FROM providers WHERE user_id = ANY(demo_users[2:6])
  );
  DELETE FROM providers WHERE user_id = ANY(demo_users[2:6]);
  DELETE FROM profiles WHERE user_id = ANY(demo_users);
  DELETE FROM auth.identities WHERE user_id = ANY(demo_users);
  DELETE FROM auth.users WHERE id = ANY(demo_users);

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    inst_id, demo_users[1], 'authenticated', 'authenticated',
    'customer.demo@nexo.sg', crypt('Demo1234!', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"customer","full_name":"Alex Tan","phone":"91234567","address_line1":"Blk 123 Tampines Street 11","address_line2":"#08-456","postal_code":"521123","preferred_area":"Tampines"}',
    now(), now(), '', '', '', ''
  );
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(), demo_users[1],
    jsonb_build_object('sub', demo_users[1], 'email', 'customer.demo@nexo.sg'),
    'email', demo_users[1]::TEXT, now(), now(), now()
  );

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    inst_id, demo_users[2], 'authenticated', 'authenticated',
    'cleanpro@nexo.sg', crypt('Demo1234!', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"provider","full_name":"Sarah Lim","phone":"92345678","business_name":"CleanPro SG","bio":"Reliable home cleaning for HDB and condos. Eco-friendly products available. Same-day slots in the East.","years_experience":"5","hourly_rate":"35","service_areas":"Tampines,Bedok,Pasir Ris,Simei"}',
    now(), now(), '', '', '', ''
  );
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), demo_users[2], jsonb_build_object('sub', demo_users[2], 'email', 'cleanpro@nexo.sg'), 'email', demo_users[2]::TEXT, now(), now(), now());

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    inst_id, demo_users[3], 'authenticated', 'authenticated',
    'handyman.sg@nexo.sg', crypt('Demo1234!', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"provider","full_name":"Raj Kumar","phone":"93456789","business_name":"FixIt Handyman","bio":"Drilling, mounting, minor repairs and IKEA assembly. Tools provided.","years_experience":"8","hourly_rate":"55","service_areas":"Jurong East,Clementi,Bukit Batok,CBD"}',
    now(), now(), '', '', '', ''
  );
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), demo_users[3], jsonb_build_object('sub', demo_users[3], 'email', 'handyman.sg@nexo.sg'), 'email', demo_users[3]::TEXT, now(), now(), now());

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    inst_id, demo_users[4], 'authenticated', 'authenticated',
    'aircool@nexo.sg', crypt('Demo1234!', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"provider","full_name":"Michelle Ong","phone":"94567890","business_name":"CoolAir Services","bio":"Licensed aircon general service, chemical wash and gas top-up. Warranty on all jobs.","years_experience":"10","hourly_rate":"45","service_areas":"Ang Mo Kio,Bishan,Toa Payoh,Woodlands,Yishun"}',
    now(), now(), '', '', '', ''
  );
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), demo_users[4], jsonb_build_object('sub', demo_users[4], 'email', 'aircool@nexo.sg'), 'email', demo_users[4]::TEXT, now(), now(), now());

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    inst_id, demo_users[5], 'authenticated', 'authenticated',
    'swiftmove@nexo.sg', crypt('Demo1234!', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"provider","full_name":"David Teo","phone":"95678901","business_name":"SwiftMove SG","bio":"HDB and condo moves with packing materials included. 2-man crew, no hidden fees.","years_experience":"6","hourly_rate":"80","service_areas":"Tampines,Bedok,Simei,Pasir Ris"}',
    now(), now(), '', '', '', ''
  );
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), demo_users[5], jsonb_build_object('sub', demo_users[5], 'email', 'swiftmove@nexo.sg'), 'email', demo_users[5]::TEXT, now(), now(), now());

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    inst_id, demo_users[6], 'authenticated', 'authenticated',
    'pipefix@nexo.sg', crypt('Demo1234!', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"provider","full_name":"James Wong","phone":"96789012","business_name":"PipeFix Plumbing","bio":"Leak repairs, tap replacements and choke clearing. PUB licensed, 24hr emergency call-outs.","years_experience":"12","hourly_rate":"70","service_areas":"Tampines,Bedok,Ang Mo Kio,Bishan,Toa Payoh"}',
    now(), now(), '', '', '', ''
  );
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), demo_users[6], jsonb_build_object('sub', demo_users[6], 'email', 'pipefix@nexo.sg'), 'email', demo_users[6]::TEXT, now(), now(), now());
END $$;

-- Profiles & providers: auth trigger may not run on direct SQL Editor inserts — upsert explicitly
INSERT INTO profiles (user_id, email, full_name, phone, role, address_line1, address_line2, postal_code, preferred_area)
VALUES
  ('a1111111-1111-1111-1111-111111111101', 'customer.demo@nexo.sg', 'Alex Tan', '91234567', 'customer', 'Blk 123 Tampines Street 11', '#08-456', '521123', 'Tampines'),
  ('a2222222-2222-2222-2222-222222222201', 'cleanpro@nexo.sg', 'Sarah Lim', '92345678', 'provider', NULL, NULL, NULL, NULL),
  ('a3333333-3333-3333-3333-333333333301', 'handyman.sg@nexo.sg', 'Raj Kumar', '93456789', 'provider', NULL, NULL, NULL, NULL),
  ('a4444444-4444-4444-4444-444444444401', 'aircool@nexo.sg', 'Michelle Ong', '94567890', 'provider', NULL, NULL, NULL, NULL),
  ('a5555555-5555-5555-5555-555555555501', 'swiftmove@nexo.sg', 'David Teo', '95678901', 'provider', NULL, NULL, NULL, NULL),
  ('a6666666-6666-6666-6666-666666666601', 'pipefix@nexo.sg', 'James Wong', '96789012', 'provider', NULL, NULL, NULL, NULL)
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  address_line1 = EXCLUDED.address_line1,
  address_line2 = EXCLUDED.address_line2,
  postal_code = EXCLUDED.postal_code,
  preferred_area = EXCLUDED.preferred_area;

INSERT INTO providers (user_id, business_name, bio, years_experience, hourly_rate, service_areas, is_verified, is_active, rating_avg, rating_count)
VALUES
  ('a2222222-2222-2222-2222-222222222201', 'CleanPro SG', 'Reliable home cleaning for HDB and condos. Eco-friendly products available. Same-day slots in the East.', 5, 35, ARRAY['Tampines', 'Bedok', 'Pasir Ris', 'Simei'], true, true, 4.8, 24),
  ('a3333333-3333-3333-3333-333333333301', 'FixIt Handyman', 'Drilling, mounting, minor repairs and IKEA assembly. Tools provided.', 8, 55, ARRAY['Jurong East', 'Clementi', 'Bukit Batok', 'CBD'], true, true, 4.6, 18),
  ('a4444444-4444-4444-4444-444444444401', 'CoolAir Services', 'Licensed aircon general service, chemical wash and gas top-up. Warranty on all jobs.', 10, 45, ARRAY['Ang Mo Kio', 'Bishan', 'Toa Payoh', 'Woodlands', 'Yishun'], true, true, 4.9, 31),
  ('a5555555-5555-5555-5555-555555555501', 'SwiftMove SG', 'HDB and condo moves with packing materials included. 2-man crew, no hidden fees.', 6, 80, ARRAY['Tampines', 'Bedok', 'Simei', 'Pasir Ris'], true, true, 4.7, 15),
  ('a6666666-6666-6666-6666-666666666601', 'PipeFix Plumbing', 'Leak repairs, tap replacements and choke clearing. PUB licensed, 24hr emergency call-outs.', 12, 70, ARRAY['Tampines', 'Bedok', 'Ang Mo Kio', 'Bishan', 'Toa Payoh'], true, true, 4.5, 22)
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

UPDATE profiles SET full_name = 'Alex Tan', phone = '91234567', address_line1 = 'Blk 123 Tampines Street 11', address_line2 = '#08-456', postal_code = '521123', preferred_area = 'Tampines'
WHERE user_id = 'a1111111-1111-1111-1111-111111111101';

INSERT INTO provider_services (provider_id, service_id, price_from, description)
SELECT p.id, s.id, prices.price_from, prices.description
FROM (VALUES
  ('a2222222-2222-2222-2222-222222222201'::UUID, 'cleaning-standard', 45::NUMERIC, '2-room HDB from $45 · supplies included'),
  ('a3333333-3333-3333-3333-333333333301'::UUID, 'handyman-standard', 65::NUMERIC, 'First hour incl. drill & basic tools'),
  ('a4444444-4444-4444-4444-444444444401'::UUID, 'aircon-standard', 50::NUMERIC, 'Per unit general servicing'),
  ('a5555555-5555-5555-5555-555555555501'::UUID, 'movers-standard', 120::NUMERIC, '1-bedroom local move · 2-man crew'),
  ('a6666666-6666-6666-6666-666666666601'::UUID, 'plumbing-standard', 75::NUMERIC, 'Leak inspection + first 30 min labour')
) AS prices(user_id, service_slug, price_from, description)
JOIN providers p ON p.user_id = prices.user_id
JOIN services s ON s.slug = prices.service_slug
ON CONFLICT (provider_id, service_id) DO UPDATE SET price_from = EXCLUDED.price_from, description = EXCLUDED.description;

INSERT INTO bookings (id, customer_id, provider_id, service_id, status, scheduled_at, duration_hours, address_line1, address_line2, postal_code, notes, total_price, created_at, updated_at)
SELECT 'b1111111-1111-1111-1111-111111111101', 'a1111111-1111-1111-1111-111111111101', p.id, s.id, 'completed', now() - INTERVAL '7 days', 2, 'Blk 123 Tampines Street 11', '#08-456', '521123', 'Area: Tampines. Deep clean before CNY.', 90, now() - INTERVAL '8 days', now() - INTERVAL '6 days'
FROM providers p JOIN services s ON s.slug = 'cleaning-standard' WHERE p.user_id = 'a2222222-2222-2222-2222-222222222201';

INSERT INTO bookings (id, customer_id, provider_id, service_id, status, scheduled_at, duration_hours, address_line1, address_line2, postal_code, notes, total_price, created_at, updated_at)
SELECT 'b2222222-2222-2222-2222-222222222201', 'a1111111-1111-1111-1111-111111111101', p.id, s.id, 'confirmed', now() + INTERVAL '3 days', 3, 'Blk 123 Tampines Street 11', '#08-456', '521123', 'Area: Tampines. Moving to Bedok — 1-bedroom HDB.', 360, now() - INTERVAL '1 day', now() - INTERVAL '12 hours'
FROM providers p JOIN services s ON s.slug = 'movers-standard' WHERE p.user_id = 'a5555555-5555-5555-5555-555555555501';

INSERT INTO bookings (id, customer_id, provider_id, service_id, status, scheduled_at, duration_hours, address_line1, address_line2, postal_code, notes, total_price, created_at, updated_at)
SELECT 'b3333333-3333-3333-3333-333333333301', 'a1111111-1111-1111-1111-111111111101', p.id, s.id, 'in_progress', now() - INTERVAL '1 hour', 1.5, 'Blk 123 Tampines Street 11', '#08-456', '521123', 'Area: Tampines. Kitchen sink leaking.', 105, now() - INTERVAL '2 days', now() - INTERVAL '1 hour'
FROM providers p JOIN services s ON s.slug = 'plumbing-standard' WHERE p.user_id = 'a6666666-6666-6666-6666-666666666601';

INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by, created_at) VALUES
  ('b1111111-1111-1111-1111-111111111101', NULL, 'pending', 'a1111111-1111-1111-1111-111111111101', now() - INTERVAL '8 days'),
  ('b1111111-1111-1111-1111-111111111101', 'pending', 'confirmed', 'a2222222-2222-2222-2222-222222222201', now() - INTERVAL '7 days 20 hours'),
  ('b1111111-1111-1111-1111-111111111101', 'confirmed', 'in_progress', 'a2222222-2222-2222-2222-222222222201', now() - INTERVAL '7 days 2 hours'),
  ('b1111111-1111-1111-1111-111111111101', 'in_progress', 'completed', 'a2222222-2222-2222-2222-222222222201', now() - INTERVAL '6 days'),
  ('b2222222-2222-2222-2222-222222222201', NULL, 'pending', 'a1111111-1111-1111-1111-111111111101', now() - INTERVAL '1 day'),
  ('b2222222-2222-2222-2222-222222222201', 'pending', 'confirmed', 'a5555555-5555-5555-5555-555555555501', now() - INTERVAL '12 hours'),
  ('b3333333-3333-3333-3333-333333333301', NULL, 'pending', 'a1111111-1111-1111-1111-111111111101', now() - INTERVAL '2 days'),
  ('b3333333-3333-3333-3333-333333333301', 'pending', 'confirmed', 'a6666666-6666-6666-6666-666666666601', now() - INTERVAL '1 day'),
  ('b3333333-3333-3333-3333-333333333301', 'confirmed', 'in_progress', 'a6666666-6666-6666-6666-666666666601', now() - INTERVAL '1 hour');

INSERT INTO reviews (booking_id, customer_id, provider_id, rating, comment, created_at)
SELECT 'b1111111-1111-1111-1111-111111111101', 'a1111111-1111-1111-1111-111111111101', p.id, 5, 'Very thorough cleaning. Sarah and team were punctual and left the place spotless.', now() - INTERVAL '5 days'
FROM providers p WHERE p.user_id = 'a2222222-2222-2222-2222-222222222201'
ON CONFLICT (booking_id) DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment;

INSERT INTO notifications (user_id, title, body, type, metadata, read_at, created_at) VALUES
  ('a1111111-1111-1111-1111-111111111101', 'Booking Completed', 'Your CleanPro SG cleaning is marked complete.', 'booking', '{"booking_id":"b1111111-1111-1111-1111-111111111101","status":"completed"}', now() - INTERVAL '5 days', now() - INTERVAL '6 days'),
  ('a1111111-1111-1111-1111-111111111101', 'Review submitted', 'Thanks for rating CleanPro SG!', 'review', '{"booking_id":"b1111111-1111-1111-1111-111111111101"}', now() - INTERVAL '5 days', now() - INTERVAL '5 days'),
  ('a1111111-1111-1111-1111-111111111101', 'Booking Confirmed', 'SwiftMove SG confirmed your upcoming move.', 'booking', '{"booking_id":"b2222222-2222-2222-2222-222222222201","status":"confirmed"}', NULL, now() - INTERVAL '12 hours'),
  ('a1111111-1111-1111-1111-111111111101', 'Job in progress', 'PipeFix Plumbing has started your repair.', 'booking', '{"booking_id":"b3333333-3333-3333-3333-333333333301","status":"in_progress"}', NULL, now() - INTERVAL '1 hour');

-- Sample PayNow payments (run add-payments.sql first)
INSERT INTO payments (booking_id, customer_id, amount, paynow_mobile, reference, payment_kind, status, booking_details, paid_at)
VALUES
  (
    'b1111111-1111-1111-1111-111111111101',
    'a1111111-1111-1111-1111-111111111101',
    90, '+6587877525', 'NEXO-B1111111', 'customer_advance', 'paid',
    '{"booking_id":"b1111111-1111-1111-1111-111111111101","service_name":"Standard Home Cleaning","provider_name":"CleanPro SG"}',
    now() - INTERVAL '7 days'
  ),
  (
    'b2222222-2222-2222-2222-222222222201',
    'a1111111-1111-1111-1111-111111111101',
    360, '+6587877525', 'NEXO-B2222222', 'customer_advance', 'pending',
    '{"booking_id":"b2222222-2222-2222-2222-222222222201","service_name":"Local Move (1-bedroom)","provider_name":"SwiftMove SG"}',
    NULL
  ),
  (
    'b3333333-3333-3333-3333-333333333301',
    'a1111111-1111-1111-1111-111111111101',
    105, '+6587877525', 'NEXO-B3333333', 'customer_advance', 'paid',
    '{"booking_id":"b3333333-3333-3333-3333-333333333301","service_name":"Plumbing Inspection & Repair","provider_name":"PipeFix Plumbing"}',
    now() - INTERVAL '1 day'
  )
ON CONFLICT (booking_id) DO UPDATE SET
  amount = EXCLUDED.amount,
  status = EXCLUDED.status,
  reference = EXCLUDED.reference,
  booking_details = EXCLUDED.booking_details,
  paid_at = EXCLUDED.paid_at;
