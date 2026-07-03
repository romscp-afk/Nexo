-- Fix: public survey form insert blocked by missing table grants
-- Run in Supabase SQL Editor if submissions fail with RLS error 42501.

GRANT USAGE ON SCHEMA gathering TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON gathering.survey_submissions TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA gathering TO anon, authenticated, service_role;

DROP POLICY IF EXISTS survey_insert_public ON gathering.survey_submissions;
CREATE POLICY survey_insert_public ON gathering.survey_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
