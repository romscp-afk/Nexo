-- Clear all Nexo users and related transactional data for end-to-end testing.
-- Keeps service categories, services, and schema intact.

DO $clear$
DECLARE
  tbl TEXT;
  user_tables TEXT[] := ARRAY[
    'reviews',
    'payments',
    'receipts',
    'booking_status_history',
    'bookings',
    'notifications',
    'activity_logs',
    'audit_logs',
    'phone_verifications',
    'provider_services',
    'providers',
    'profiles'
  ];
BEGIN
  FOREACH tbl IN ARRAY user_tables
  LOOP
    BEGIN
      EXECUTE format('DELETE FROM %I', tbl);
      RAISE NOTICE 'Cleared table: %', tbl;
    EXCEPTION
      WHEN undefined_table THEN
        RAISE NOTICE 'Skipping missing table: %', tbl;
    END;
  END LOOP;

  DELETE FROM auth.identities;
  DELETE FROM auth.users;

  RAISE NOTICE 'All users and roles cleared. Catalog data preserved.';
END;
$clear$;
