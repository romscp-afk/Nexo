-- Promote romalgk@gmail.com to admin — run AFTER the user exists in Authentication.
-- Or use the app "Create admin account" button on the login page.

CREATE OR REPLACE FUNCTION nexo_admin_emails()
RETURNS TEXT[] AS $$
  SELECT ARRAY['romalgk@gmail.com']::TEXT[];
$$ LANGUAGE sql IMMUTABLE;

INSERT INTO profiles (user_id, email, full_name, phone, role)
SELECT id, email, 'Romal Admin', '87877525', 'admin'::user_role
FROM auth.users
WHERE lower(email) = 'romalgk@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  role = 'admin';

SELECT user_id::text, email, role FROM profiles WHERE lower(email) = 'romalgk@gmail.com';
