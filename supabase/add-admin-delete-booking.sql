-- Admin delete booking (accidental / test bookings). Cascades related rows.
-- Safe to re-run.

CREATE OR REPLACE FUNCTION admin_delete_booking(p_booking_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  booking_row bookings%ROWTYPE;
  service_name TEXT;
  provider_name TEXT;
  customer_email TEXT;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can delete bookings';
  END IF;

  SELECT * INTO booking_row FROM bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  SELECT s.name INTO service_name FROM services s WHERE s.id = booking_row.service_id;
  SELECT pr.business_name INTO provider_name FROM providers pr WHERE pr.id = booking_row.provider_id;
  SELECT email INTO customer_email FROM profiles WHERE user_id = booking_row.customer_id;

  PERFORM log_audit_action(
    'delete_booking',
    'booking',
    p_booking_id,
    jsonb_build_object(
      'status', booking_row.status,
      'service_name', service_name,
      'provider_name', provider_name,
      'customer_email', customer_email,
      'scheduled_at', booking_row.scheduled_at,
      'reference', nexo_payment_reference(p_booking_id)
    )
  );

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_activity') THEN
    PERFORM log_activity(
      auth.uid(),
      'admin',
      'booking_deleted',
      'booking',
      p_booking_id,
      'Admin deleted booking ' || nexo_payment_reference(p_booking_id),
      jsonb_build_object(
        'booking_id', p_booking_id,
        'status', booking_row.status,
        'service_name', service_name,
        'customer_email', customer_email
      )
    );
  END IF;

  DELETE FROM bookings WHERE id = p_booking_id;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_delete_booking(UUID) TO authenticated;

DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION
  WHEN others THEN NULL;
END $$;
