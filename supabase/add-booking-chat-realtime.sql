-- Enable Supabase Realtime for instant chat updates

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'booking_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE booking_messages;
  END IF;
END $$;
