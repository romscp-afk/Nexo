-- Provider profile photos for verification (public read).
-- Path convention: {user_id}/profile.{jpg|png|webp}

INSERT INTO storage.buckets (id, name, public)
VALUES ('provider-avatars', 'provider-avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS provider_avatars_read ON storage.objects;
CREATE POLICY provider_avatars_read ON storage.objects FOR SELECT
  USING (bucket_id = 'provider-avatars');

DROP POLICY IF EXISTS provider_avatars_insert_own ON storage.objects;
CREATE POLICY provider_avatars_insert_own ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'provider-avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS provider_avatars_update_own ON storage.objects;
CREATE POLICY provider_avatars_update_own ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'provider-avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS provider_avatars_delete_own ON storage.objects;
CREATE POLICY provider_avatars_delete_own ON storage.objects FOR DELETE
  USING (
    bucket_id = 'provider-avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

NOTIFY pgrst, 'reload schema';
