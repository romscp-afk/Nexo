-- Let active providers read open pending bookings they can accept (matches alert rules).
-- Safe to re-run.

DROP POLICY IF EXISTS "bookings_select" ON bookings;
CREATE POLICY "bookings_select" ON bookings FOR SELECT USING (
  customer_id = auth.uid()
  OR EXISTS (SELECT 1 FROM providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
  OR (
    provider_id IS NULL
    AND status = 'pending'
    AND EXISTS (
      SELECT 1 FROM providers p
      WHERE p.user_id = auth.uid()
        AND p.is_active = true
        AND provider_offers_booking_service(p.id, bookings.service_id)
    )
  )
  OR is_admin()
);

DROP POLICY IF EXISTS "status_history_select" ON booking_status_history;
CREATE POLICY "status_history_select" ON booking_status_history FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = booking_id
      AND (
        b.customer_id = auth.uid()
        OR EXISTS (SELECT 1 FROM providers p WHERE p.id = b.provider_id AND p.user_id = auth.uid())
        OR (
          b.provider_id IS NULL
          AND b.status = 'pending'
          AND EXISTS (
            SELECT 1 FROM providers p
            WHERE p.user_id = auth.uid()
              AND p.is_active = true
              AND provider_offers_booking_service(p.id, b.service_id)
          )
        )
        OR is_admin()
      )
  )
);

DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION
  WHEN others THEN NULL;
END $$;
