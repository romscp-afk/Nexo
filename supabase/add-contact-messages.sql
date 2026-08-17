-- Public contact form messages for Nexo support (Phase 1 cleaning).
-- Prerequisite: schema.sql (is_admin()).

CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx
  ON contact_messages (created_at DESC);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contact_messages_insert_public ON contact_messages;
CREATE POLICY contact_messages_insert_public ON contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(trim(full_name)) >= 2
    AND length(trim(email)) >= 5
    AND length(trim(subject)) >= 3
    AND length(trim(message)) >= 10
  );

DROP POLICY IF EXISTS contact_messages_select_admin ON contact_messages;
CREATE POLICY contact_messages_select_admin ON contact_messages
  FOR SELECT
  TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS contact_messages_update_admin ON contact_messages;
CREATE POLICY contact_messages_update_admin ON contact_messages
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

NOTIFY pgrst, 'reload schema';
