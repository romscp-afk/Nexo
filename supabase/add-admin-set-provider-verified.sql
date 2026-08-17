-- Reliable admin provider verification (no client-side RLS edge cases)

CREATE OR REPLACE FUNCTION admin_set_provider_verified(p_provider_id UUID, p_is_verified BOOLEAN)
RETURNS providers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target providers%ROWTYPE;
  profile_row profiles%ROWTYPE;
  has_photo BOOLEAN;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can verify providers';
  END IF;

  SELECT * INTO target FROM providers WHERE id = p_provider_id;
  IF target.id IS NULL THEN
    RAISE EXCEPTION 'Provider not found';
  END IF;

  SELECT * INTO profile_row FROM profiles WHERE user_id = target.user_id;

  UPDATE providers
  SET is_verified = p_is_verified, updated_at = now()
  WHERE id = p_provider_id
  RETURNING * INTO target;

  has_photo := profile_row.avatar_url IS NOT NULL AND profile_row.avatar_url <> '';

  PERFORM log_audit_action(
    'set_provider_verified',
    'provider',
    p_provider_id,
    jsonb_build_object(
      'business_name', target.business_name,
      'user_id', target.user_id,
      'is_verified', p_is_verified,
      'has_profile_photo', has_photo
    )
  );

  RETURN target;
END;
$$;

CREATE OR REPLACE FUNCTION admin_sync_provider_listings()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count INTEGER := 0;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can sync provider listings';
  END IF;

  INSERT INTO providers (user_id, business_name, years_experience, hourly_rate, service_areas, is_active)
  SELECT p.user_id, p.full_name, 0, 0, '{}'::TEXT[], true
  FROM profiles p
  LEFT JOIN providers pr ON pr.user_id = p.user_id
  WHERE p.role = 'provider' AND pr.id IS NULL;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_set_provider_verified(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_sync_provider_listings() TO authenticated;

NOTIFY pgrst, 'reload schema';
