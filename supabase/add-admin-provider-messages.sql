-- Admin ↔ provider support messages (separate from booking chat)
-- Run after schema.sql

CREATE TABLE IF NOT EXISTS admin_provider_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(trim(body)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_provider_messages_provider
  ON admin_provider_messages(provider_id, created_at);

ALTER TABLE admin_provider_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_provider_messages_admin_all ON admin_provider_messages;
CREATE POLICY admin_provider_messages_admin_all ON admin_provider_messages
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS admin_provider_messages_provider_select ON admin_provider_messages;
CREATE POLICY admin_provider_messages_provider_select ON admin_provider_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM providers p
      WHERE p.id = admin_provider_messages.provider_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS admin_provider_messages_provider_insert ON admin_provider_messages;
CREATE POLICY admin_provider_messages_provider_insert ON admin_provider_messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM providers p
      WHERE p.id = provider_id AND p.user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION notify_provider_on_admin_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  provider_user_id UUID;
BEGIN
  IF NOT is_admin() THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO provider_user_id FROM providers WHERE id = NEW.provider_id;

  IF provider_user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, body, type, metadata)
    VALUES (
      provider_user_id,
      'Message from Nexo admin',
      LEFT(NEW.body, 120) || CASE WHEN char_length(NEW.body) > 120 THEN '…' ELSE '' END,
      'system',
      jsonb_build_object('provider_id', NEW.provider_id, 'kind', 'admin_support')
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS admin_provider_messages_notify ON admin_provider_messages;
CREATE TRIGGER admin_provider_messages_notify
  AFTER INSERT ON admin_provider_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_provider_on_admin_message();
