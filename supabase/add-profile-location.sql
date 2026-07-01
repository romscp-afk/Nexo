-- Add customer location fields to profiles (run after schema.sql if table already exists)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS preferred_area TEXT;

-- Re-apply signup trigger: paste contents of supabase/fix-auth-trigger.sql after this migration
