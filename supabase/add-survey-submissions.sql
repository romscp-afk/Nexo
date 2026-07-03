-- Silver Legacy survey — separate schema in the Nexo Supabase database
-- Keeps gathering data isolated from core Nexo tables (profiles, bookings, etc.)
--
-- BEFORE running (optional if you use the ALTER ROLE lines at the bottom):
--   Supabase Dashboard → Integrations → Data API → Settings → Exposed schemas
--   Add "gathering" alongside "public", then Save.
--
-- Prerequisite: Nexo schema.sql (is_admin() function must exist).

CREATE SCHEMA IF NOT EXISTS gathering;

GRANT USAGE ON SCHEMA gathering TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA gathering TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA gathering TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA gathering
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA gathering
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS gathering.survey_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  school TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  contact_is_whatsapp BOOLEAN NOT NULL DEFAULT true,
  whatsapp_number TEXT,
  email TEXT NOT NULL,
  work_place TEXT,
  designation TEXT,
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS survey_submissions_created_at_idx
  ON gathering.survey_submissions (created_at DESC);

-- Grants must run after the table exists
GRANT SELECT, INSERT, UPDATE, DELETE ON gathering.survey_submissions TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA gathering TO anon, authenticated, service_role;

ALTER TABLE gathering.survey_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can submit (public survey form, no login)
DROP POLICY IF EXISTS survey_insert_public ON gathering.survey_submissions;
CREATE POLICY survey_insert_public ON gathering.survey_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only Nexo admins can view submissions
DROP POLICY IF EXISTS survey_select_admin ON gathering.survey_submissions;
CREATE POLICY survey_select_admin ON gathering.survey_submissions
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Only Nexo admins can delete submissions
DROP POLICY IF EXISTS survey_delete_admin ON gathering.survey_submissions;
CREATE POLICY survey_delete_admin ON gathering.survey_submissions
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- Expose gathering schema to the Data API (adds to your current exposed schemas)
ALTER ROLE authenticator SET pgrst.db_schemas = 'public, graphql_public, gathering';
NOTIFY pgrst, 'reload config';

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Verify (should return gathering.survey_submissions)
SELECT to_regclass('gathering.survey_submissions') AS survey_table_ready;
