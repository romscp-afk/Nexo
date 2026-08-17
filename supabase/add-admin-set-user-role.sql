-- Admin role changes with provider row lifecycle

CREATE OR REPLACE FUNCTION admin_set_user_role(p_user_id UUID, p_role user_role)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target profiles%ROWTYPE;
  previous_role user_role;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can change user roles';
  END IF;

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot change your own role';
  END IF;

  SELECT * INTO target FROM profiles WHERE user_id = p_user_id;
  IF target.user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  previous_role := target.role;

  IF previous_role = 'admin' THEN
    RAISE EXCEPTION 'Admin accounts cannot be changed';
  END IF;

  IF previous_role = p_role THEN
    RETURN target;
  END IF;

  IF p_role = 'provider' THEN
    INSERT INTO providers (user_id, business_name, years_experience, hourly_rate, service_areas, is_active)
    VALUES (p_user_id, target.full_name, 0, 0, '{}'::TEXT[], true)
    ON CONFLICT (user_id) DO UPDATE
      SET business_name = EXCLUDED.business_name,
          is_active = true,
          updated_at = now();
  ELSIF previous_role = 'provider' THEN
    DELETE FROM providers WHERE user_id = p_user_id;
  END IF;

  UPDATE profiles
  SET role = p_role, updated_at = now()
  WHERE user_id = p_user_id
  RETURNING * INTO target;

  PERFORM log_audit_action(
    'set_user_role',
    'profile',
    p_user_id,
    jsonb_build_object(
      'email', target.email,
      'previous_role', previous_role,
      'new_role', p_role
    )
  );

  RETURN target;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_set_user_role(UUID, user_role) TO authenticated;

NOTIFY pgrst, 'reload schema';
