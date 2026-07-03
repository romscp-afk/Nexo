-- Admin chat oversight + email alerts for new booking messages

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_platform_setting(p_key TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT value FROM platform_settings WHERE key = p_key LIMIT 1;
$$;

INSERT INTO platform_settings (key, value)
VALUES
  ('chat_email_function_url', 'https://zitofnocwbpoczqdrdbr.supabase.co/functions/v1/send-chat-email'),
  ('chat_email_webhook_secret', 'nexo-chat-email-change-me')
ON CONFLICT (key) DO NOTHING;

-- Admin can read all booking messages (oversight)
DROP POLICY IF EXISTS "booking_messages_admin_select" ON booking_messages;
CREATE POLICY "booking_messages_admin_select" ON booking_messages FOR SELECT
  USING (is_admin());

CREATE OR REPLACE FUNCTION dispatch_chat_email_notification(
  p_recipient_user_id UUID,
  p_recipient_role TEXT,
  p_booking_id UUID,
  p_sender_name TEXT,
  p_message_body TEXT,
  p_service_name TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fn_url TEXT;
  webhook_secret TEXT;
BEGIN
  fn_url := get_platform_setting('chat_email_function_url');
  webhook_secret := get_platform_setting('chat_email_webhook_secret');
  IF fn_url IS NULL OR webhook_secret IS NULL THEN
    RETURN;
  END IF;

  PERFORM extensions.net.http_post(
    url := fn_url,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'webhook_secret', webhook_secret,
      'recipient_user_id', p_recipient_user_id,
      'recipient_role', p_recipient_role,
      'booking_id', p_booking_id,
      'sender_name', p_sender_name,
      'message_body', p_message_body,
      'service_name', p_service_name
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Email dispatch must not block chat inserts
    NULL;
END;
$$;

CREATE OR REPLACE FUNCTION notify_booking_message()
RETURNS TRIGGER AS $$
DECLARE
  booking_row bookings%ROWTYPE;
  recipient UUID;
  recipient_role TEXT;
  sender_name TEXT;
  sender_role user_role;
  service_name TEXT;
BEGIN
  SELECT * INTO booking_row FROM bookings WHERE id = NEW.booking_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  SELECT full_name, role INTO sender_name, sender_role
  FROM profiles WHERE user_id = NEW.sender_id;

  SELECT s.name INTO service_name
  FROM services s
  WHERE s.id = booking_row.service_id;

  IF NEW.sender_id = booking_row.customer_id THEN
    SELECT user_id INTO recipient FROM providers WHERE id = booking_row.provider_id;
    recipient_role := 'provider';
  ELSE
    recipient := booking_row.customer_id;
    recipient_role := 'customer';
  END IF;

  IF recipient IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, body, type, metadata)
    VALUES (
      recipient,
      'New chat message',
      COALESCE(sender_name, 'Someone') || ': ' || LEFT(NEW.body, 120),
      'booking',
      jsonb_build_object(
        'kind', 'chat_message',
        'booking_id', NEW.booking_id,
        'message_id', NEW.id,
        'sender_id', NEW.sender_id,
        'service_name', service_name
      )
    );

    PERFORM dispatch_chat_email_notification(
      recipient,
      recipient_role,
      NEW.booking_id,
      COALESCE(sender_name, 'Someone'),
      NEW.body,
      service_name
    );
  END IF;

  PERFORM log_activity(
    NEW.sender_id,
    sender_role,
    'chat_message_sent',
    'booking',
    NEW.booking_id,
    COALESCE(sender_name, 'User') || ' sent a chat message',
    jsonb_build_object(
      'message_id', NEW.id,
      'preview', LEFT(NEW.body, 200),
      'recipient_user_id', recipient,
      'service_name', service_name
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS booking_messages_notify ON booking_messages;
CREATE TRIGGER booking_messages_notify
  AFTER INSERT ON booking_messages
  FOR EACH ROW EXECUTE FUNCTION notify_booking_message();
