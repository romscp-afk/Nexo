-- Check admin account romscp@gmail.com

SELECT 'auth.users' AS source, id::text, email, email_confirmed_at IS NOT NULL AS confirmed
FROM auth.users
WHERE lower(email) = 'romscp@gmail.com';

SELECT 'profiles' AS source, user_id::text, email, role::text
FROM profiles
WHERE lower(email) = 'romscp@gmail.com';
