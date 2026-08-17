-- Admin delete user / provider (keeps catalog; registered admins protected)

CREATE OR REPLACE FUNCTION admin_delete_user(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  target_role user_role;
  target_email TEXT;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot delete your own account';
  END IF;

  SELECT role, email INTO target_role, target_email
  FROM profiles
  WHERE user_id = p_user_id;

  IF target_role IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF target_role = 'admin' THEN
    RAISE EXCEPTION 'Admin accounts cannot be deleted';
  END IF;

  PERFORM log_audit_action(
    'delete_user',
    'profile',
    p_user_id,
    jsonb_build_object('email', target_email, 'role', target_role)
  );

  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION admin_delete_provider(p_provider_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  provider_user_id UUID;
  provider_name TEXT;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can delete providers';
  END IF;

  SELECT user_id, business_name INTO provider_user_id, provider_name
  FROM providers
  WHERE id = p_provider_id;

  IF provider_user_id IS NULL THEN
    RAISE EXCEPTION 'Provider not found';
  END IF;

  PERFORM log_audit_action(
    'delete_provider',
    'provider',
    p_provider_id,
    jsonb_build_object('business_name', provider_name, 'user_id', provider_user_id)
  );

  DELETE FROM providers WHERE id = p_provider_id;

  UPDATE profiles
  SET role = 'customer', updated_at = now()
  WHERE user_id = provider_user_id AND role = 'provider';
END;
$$;

GRANT EXECUTE ON FUNCTION admin_delete_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_provider(UUID) TO authenticated;
