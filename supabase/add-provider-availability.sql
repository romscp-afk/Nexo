-- Provider weekly availability + booking slot validation (Asia/Singapore)

CREATE TABLE IF NOT EXISTS provider_weekly_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_available BOOLEAN NOT NULL DEFAULT true,
  start_time TIME NOT NULL DEFAULT '09:00',
  end_time TIME NOT NULL DEFAULT '18:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_provider_weekly_hours_provider ON provider_weekly_hours(provider_id);

ALTER TABLE provider_weekly_hours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "provider_weekly_hours_select" ON provider_weekly_hours;
CREATE POLICY "provider_weekly_hours_select" ON provider_weekly_hours FOR SELECT USING (true);

DROP POLICY IF EXISTS "provider_weekly_hours_manage_own" ON provider_weekly_hours;
CREATE POLICY "provider_weekly_hours_manage_own" ON provider_weekly_hours FOR ALL USING (
  EXISTS (SELECT 1 FROM providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
);

DROP POLICY IF EXISTS "provider_weekly_hours_admin" ON provider_weekly_hours;
CREATE POLICY "provider_weekly_hours_admin" ON provider_weekly_hours FOR ALL USING (is_admin());

CREATE TRIGGER provider_weekly_hours_updated_at
  BEFORE UPDATE ON provider_weekly_hours
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed default hours for existing providers (Mon–Sat 9–18, Sun off)
INSERT INTO provider_weekly_hours (provider_id, day_of_week, is_available, start_time, end_time)
SELECT p.id, d.dow,
  CASE WHEN d.dow = 0 THEN false ELSE true END,
  CASE WHEN d.dow = 6 THEN '09:00'::TIME ELSE '09:00'::TIME END,
  CASE WHEN d.dow = 6 THEN '13:00'::TIME ELSE '18:00'::TIME END
FROM providers p
CROSS JOIN generate_series(0, 6) AS d(dow)
ON CONFLICT (provider_id, day_of_week) DO NOTHING;

CREATE OR REPLACE FUNCTION check_provider_booking_slot(
  p_provider_id UUID,
  p_scheduled_at TIMESTAMPTZ,
  p_duration_hours NUMERIC,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  local_ts TIMESTAMP;
  local_dow INT;
  local_start TIME;
  local_end TIME;
  hours_row provider_weekly_hours%ROWTYPE;
  conflict_id UUID;
BEGIN
  IF p_provider_id IS NULL THEN
    RETURN jsonb_build_object('ok', true);
  END IF;

  local_ts := p_scheduled_at AT TIME ZONE 'Asia/Singapore';
  local_dow := EXTRACT(DOW FROM local_ts)::INT;
  local_start := local_ts::TIME;
  local_end := (local_ts + (p_duration_hours || ' hours')::INTERVAL)::TIME;

  SELECT * INTO hours_row
  FROM provider_weekly_hours
  WHERE provider_id = p_provider_id AND day_of_week = local_dow;

  IF NOT FOUND OR NOT hours_row.is_available THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Provider is not available on this day.');
  END IF;

  IF local_start < hours_row.start_time OR local_end > hours_row.end_time THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'Selected time is outside provider working hours.'
    );
  END IF;

  SELECT b.id INTO conflict_id
  FROM bookings b
  WHERE b.provider_id = p_provider_id
    AND b.status IN ('pending', 'confirmed', 'in_progress')
    AND (p_exclude_booking_id IS NULL OR b.id <> p_exclude_booking_id)
    AND tstzrange(
          b.scheduled_at,
          b.scheduled_at + (COALESCE(b.duration_hours, 1) || ' hours')::INTERVAL,
          '[)'
        ) && tstzrange(
          p_scheduled_at,
          p_scheduled_at + (p_duration_hours || ' hours')::INTERVAL,
          '[)'
        )
  LIMIT 1;

  IF conflict_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Provider already has a booking at this time.');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION check_provider_booking_slot(UUID, TIMESTAMPTZ, NUMERIC, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION enforce_provider_booking_slot()
RETURNS TRIGGER AS $$
DECLARE
  check_result JSONB;
BEGIN
  IF NEW.provider_id IS NULL OR NEW.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  check_result := check_provider_booking_slot(
    NEW.provider_id,
    NEW.scheduled_at,
    COALESCE(NEW.duration_hours, 1),
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.id ELSE NULL END
  );

  IF NOT (check_result->>'ok')::BOOLEAN THEN
    RAISE EXCEPTION '%', COALESCE(check_result->>'reason', 'Time slot not available');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bookings_enforce_provider_slot ON bookings;
CREATE TRIGGER bookings_enforce_provider_slot
  BEFORE INSERT OR UPDATE OF scheduled_at, duration_hours, provider_id, status ON bookings
  FOR EACH ROW EXECUTE FUNCTION enforce_provider_booking_slot();
