-- Provider blocked dates / time off

CREATE TABLE IF NOT EXISTS provider_time_off (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);

CREATE INDEX IF NOT EXISTS idx_provider_time_off_provider ON provider_time_off(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_time_off_range ON provider_time_off(provider_id, start_at, end_at);

ALTER TABLE provider_time_off ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "provider_time_off_select" ON provider_time_off;
CREATE POLICY "provider_time_off_select" ON provider_time_off FOR SELECT USING (true);

DROP POLICY IF EXISTS "provider_time_off_manage_own" ON provider_time_off;
CREATE POLICY "provider_time_off_manage_own" ON provider_time_off FOR ALL USING (
  EXISTS (SELECT 1 FROM providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
);

DROP POLICY IF EXISTS "provider_time_off_admin" ON provider_time_off;
CREATE POLICY "provider_time_off_admin" ON provider_time_off FOR ALL USING (is_admin());

-- Extend slot check to reject bookings during time off
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
  time_off_id UUID;
  job_end TIMESTAMPTZ;
BEGIN
  IF p_provider_id IS NULL THEN
    RETURN jsonb_build_object('ok', true);
  END IF;

  job_end := p_scheduled_at + (p_duration_hours || ' hours')::INTERVAL;

  SELECT t.id INTO time_off_id
  FROM provider_time_off t
  WHERE t.provider_id = p_provider_id
    AND tstzrange(t.start_at, t.end_at, '[)') && tstzrange(p_scheduled_at, job_end, '[)')
  LIMIT 1;

  IF time_off_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Provider is unavailable during this period (time off).');
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
        ) && tstzrange(p_scheduled_at, job_end, '[)')
  LIMIT 1;

  IF conflict_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Provider already has a booking at this time.');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;
