-- Remove Nexo demo/sample accounts and their data. Keeps all real registered users.
-- Demo sources: supabase/seed-demo.sql, supabase/seed-sample-provider.sql
--
-- Usage: npm run clear:sample-data

DO $clear$
DECLARE
  demo_user_ids UUID[];
  demo_provider_ids UUID[];
  demo_booking_ids UUID[];
  fixed_demo_users UUID[] := ARRAY[
    'a1111111-1111-1111-1111-111111111101'::UUID,
    'a2222222-2222-2222-2222-222222222201'::UUID,
    'a3333333-3333-3333-3333-333333333301'::UUID,
    'a4444444-4444-4444-4444-444444444401'::UUID,
    'a5555555-5555-5555-5555-555555555501'::UUID,
    'a6666666-6666-6666-6666-666666666601'::UUID,
    'a7777777-7777-7777-7777-777777777701'::UUID
  ];
  fixed_demo_bookings UUID[] := ARRAY[
    'b1111111-1111-1111-1111-111111111101'::UUID,
    'b2222222-2222-2222-2222-222222222201'::UUID,
    'b3333333-3333-3333-3333-333333333301'::UUID
  ];
  demo_emails TEXT[] := ARRAY[
    'customer.demo@nexo.sg',
    'cleanpro@nexo.sg',
    'handyman.sg@nexo.sg',
    'aircool@nexo.sg',
    'swiftmove@nexo.sg',
    'pipefix@nexo.sg',
    'provider.demo@nexo.sg'
  ];
BEGIN
  SELECT ARRAY(
    SELECT DISTINCT u.id
    FROM auth.users u
    WHERE u.id = ANY(fixed_demo_users)
       OR u.email = ANY(demo_emails)
  ) INTO demo_user_ids;

  IF demo_user_ids IS NULL OR array_length(demo_user_ids, 1) IS NULL THEN
    demo_user_ids := ARRAY[]::UUID[];
  END IF;

  SELECT ARRAY(
    SELECT id FROM providers WHERE user_id = ANY(demo_user_ids)
  ) INTO demo_provider_ids;

  IF demo_provider_ids IS NULL THEN
    demo_provider_ids := ARRAY[]::UUID[];
  END IF;

  SELECT ARRAY(
    SELECT DISTINCT b.id
    FROM bookings b
    WHERE b.id = ANY(fixed_demo_bookings)
       OR b.customer_id = ANY(demo_user_ids)
       OR b.provider_id = ANY(demo_provider_ids)
  ) INTO demo_booking_ids;

  IF demo_booking_ids IS NULL THEN
    demo_booking_ids := ARRAY[]::UUID[];
  END IF;

  IF array_length(demo_booking_ids, 1) > 0 THEN
    BEGIN
      DELETE FROM booking_message_reads
      WHERE booking_id = ANY(demo_booking_ids);
    EXCEPTION WHEN undefined_table THEN NULL;
    END;

    BEGIN
      DELETE FROM booking_messages
      WHERE booking_id = ANY(demo_booking_ids);
    EXCEPTION WHEN undefined_table THEN NULL;
    END;

    BEGIN
      DELETE FROM payments WHERE booking_id = ANY(demo_booking_ids);
    EXCEPTION WHEN undefined_table THEN NULL;
    END;

    BEGIN
      DELETE FROM receipts WHERE booking_id = ANY(demo_booking_ids);
    EXCEPTION WHEN undefined_table THEN NULL;
    END;

    DELETE FROM reviews WHERE booking_id = ANY(demo_booking_ids);
    DELETE FROM booking_status_history WHERE booking_id = ANY(demo_booking_ids);
    DELETE FROM bookings WHERE id = ANY(demo_booking_ids);
  END IF;

  IF array_length(demo_user_ids, 1) > 0 THEN
    DELETE FROM reviews
    WHERE customer_id = ANY(demo_user_ids)
       OR provider_id = ANY(demo_provider_ids);

    BEGIN
      DELETE FROM saved_providers
      WHERE customer_id = ANY(demo_user_ids)
         OR provider_id = ANY(demo_provider_ids);
    EXCEPTION WHEN undefined_table THEN NULL;
    END;

    DELETE FROM notifications WHERE user_id = ANY(demo_user_ids);

    BEGIN
      DELETE FROM phone_verifications WHERE user_id = ANY(demo_user_ids);
    EXCEPTION WHEN undefined_table THEN NULL;
    END;

    BEGIN
      DELETE FROM activity_logs WHERE user_id = ANY(demo_user_ids);
    EXCEPTION WHEN undefined_table THEN NULL;
    END;
  END IF;

  IF array_length(demo_provider_ids, 1) > 0 THEN
    BEGIN
      DELETE FROM provider_time_off WHERE provider_id = ANY(demo_provider_ids);
    EXCEPTION WHEN undefined_table THEN NULL;
    END;

    BEGIN
      DELETE FROM provider_weekly_hours WHERE provider_id = ANY(demo_provider_ids);
    EXCEPTION WHEN undefined_table THEN NULL;
    END;

    DELETE FROM provider_services WHERE provider_id = ANY(demo_provider_ids);
    DELETE FROM providers WHERE id = ANY(demo_provider_ids);
  END IF;

  IF array_length(demo_user_ids, 1) > 0 THEN
    DELETE FROM profiles WHERE user_id = ANY(demo_user_ids);
    DELETE FROM auth.identities WHERE user_id = ANY(demo_user_ids);
    DELETE FROM auth.users WHERE id = ANY(demo_user_ids);
  END IF;

  -- Drop seeded rating counts; recalculate from real reviews only.
  UPDATE providers p
  SET
    rating_avg = COALESCE(stats.avg_rating, 0),
    rating_count = COALESCE(stats.review_count, 0)
  FROM (
    SELECT
      provider_id,
      ROUND(AVG(rating)::numeric, 2) AS avg_rating,
      COUNT(*)::integer AS review_count
    FROM reviews
    GROUP BY provider_id
  ) stats
  WHERE p.id = stats.provider_id;

  UPDATE providers
  SET rating_avg = 0, rating_count = 0
  WHERE id NOT IN (SELECT DISTINCT provider_id FROM reviews);

  RAISE NOTICE 'Sample data cleared. Removed % demo user(s). Registered users preserved.', COALESCE(array_length(demo_user_ids, 1), 0);
END;
$clear$;
