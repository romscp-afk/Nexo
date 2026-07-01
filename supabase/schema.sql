-- Nexo — Sprint 2 database schema
-- Run in Supabase SQL Editor or: npx supabase db push

-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('customer', 'provider', 'admin');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE notification_type AS ENUM ('booking', 'review', 'system', 'admin');

-- Admin emails auto-promoted on signup (edit before first deploy)
CREATE OR REPLACE FUNCTION nexo_admin_emails()
RETURNS TEXT[] AS $$
  SELECT ARRAY['admin@nexo.sg']::TEXT[];
$$ LANGUAGE sql IMMUTABLE;

-- ─── 1. profiles ─────────────────────────────────────────────────────────────

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 2. service_categories ───────────────────────────────────────────────────

CREATE TABLE service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 3. services ─────────────────────────────────────────────────────────────

CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  base_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (category_id, slug)
);

-- ─── 4. providers ────────────────────────────────────────────────────────────

CREATE TABLE providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  bio TEXT,
  years_experience INT NOT NULL DEFAULT 0,
  hourly_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  service_areas TEXT[] NOT NULL DEFAULT '{}',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 5. provider_services ────────────────────────────────────────────────────

CREATE TABLE provider_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  price_from NUMERIC(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  UNIQUE (provider_id, service_id)
);

-- ─── 6. bookings ───────────────────────────────────────────────────────────

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  status booking_status NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_hours NUMERIC(4,1) NOT NULL DEFAULT 1,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  postal_code TEXT NOT NULL,
  notes TEXT,
  total_price NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 7. booking_status_history ───────────────────────────────────────────────

CREATE TABLE booking_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  old_status booking_status,
  new_status booking_status NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 8. reviews ──────────────────────────────────────────────────────────────

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 9. notifications ────────────────────────────────────────────────────────

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type notification_type NOT NULL DEFAULT 'system',
  read_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 10. audit_logs ──────────────────────────────────────────────────────────

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Triggers: updated_at ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER providers_updated_at
  BEFORE UPDATE ON providers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Trigger: booking status history ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION log_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by)
    VALUES (NEW.id, NULL, NEW.status, NEW.customer_id);
  ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER bookings_status_history
  AFTER INSERT OR UPDATE OF status ON bookings
  FOR EACH ROW EXECUTE FUNCTION log_booking_status_change();

-- ─── Trigger: provider rating on review ──────────────────────────────────────

CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE providers SET
    rating_avg = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE provider_id = NEW.provider_id
    ), 0),
    rating_count = (SELECT COUNT(*) FROM reviews WHERE provider_id = NEW.provider_id)
  WHERE id = NEW.provider_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER reviews_update_provider_rating
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_provider_rating();

-- ─── Trigger: signup → profile (+ provider row) ─────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role user_role;
  meta_role TEXT;
BEGIN
  meta_role := NEW.raw_user_meta_data->>'role';

  IF NEW.email = ANY(nexo_admin_emails()) THEN
    assigned_role := 'admin';
  ELSIF meta_role IN ('customer', 'provider', 'admin') THEN
    assigned_role := meta_role::user_role;
  ELSE
    assigned_role := 'customer';
  END IF;

  INSERT INTO profiles (user_id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    assigned_role
  );

  IF assigned_role = 'provider' THEN
    INSERT INTO providers (user_id, business_name)
    VALUES (
      NEW.id,
      COALESCE(
        NEW.raw_user_meta_data->>'business_name',
        NEW.raw_user_meta_data->>'full_name',
        'My Business'
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION handle_new_user() TO supabase_auth_admin;
GRANT INSERT ON public.profiles TO supabase_auth_admin;
GRANT INSERT ON public.providers TO supabase_auth_admin;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Helpers ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_provider()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'provider'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION log_audit_action(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can write audit logs';
  END IF;
  INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_details)
  RETURNING id INTO log_id;
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- profiles: customer reads/updates own; admin manages all
CREATE POLICY "profiles_select_public" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL USING (is_admin());

-- service_categories & services: public read, admin write
CREATE POLICY "categories_select" ON service_categories FOR SELECT
  USING (is_active = true OR is_admin());
CREATE POLICY "categories_admin" ON service_categories FOR ALL USING (is_admin());

CREATE POLICY "services_select" ON services FOR SELECT
  USING (is_active = true OR is_admin());
CREATE POLICY "services_admin" ON services FOR ALL USING (is_admin());

-- providers
CREATE POLICY "providers_select" ON providers FOR SELECT
  USING (is_active = true OR user_id = auth.uid() OR is_admin());
CREATE POLICY "providers_update_own" ON providers FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "providers_insert_own" ON providers FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "providers_admin" ON providers FOR ALL USING (is_admin());

-- provider_services
CREATE POLICY "provider_services_select" ON provider_services FOR SELECT USING (true);
CREATE POLICY "provider_services_manage_own" ON provider_services FOR ALL USING (
  EXISTS (
    SELECT 1 FROM providers p
    WHERE p.id = provider_id AND p.user_id = auth.uid()
  )
);
CREATE POLICY "provider_services_admin" ON provider_services FOR ALL USING (is_admin());

-- bookings: customer create/read own; provider read/update assigned; admin all
CREATE POLICY "bookings_select" ON bookings FOR SELECT USING (
  customer_id = auth.uid()
  OR EXISTS (SELECT 1 FROM providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
  OR is_admin()
);
CREATE POLICY "bookings_insert" ON bookings FOR INSERT
  WITH CHECK (customer_id = auth.uid());
CREATE POLICY "bookings_update" ON bookings FOR UPDATE USING (
  (customer_id = auth.uid() AND status IN ('pending'))
  OR EXISTS (SELECT 1 FROM providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
  OR is_admin()
);
CREATE POLICY "bookings_admin" ON bookings FOR ALL USING (is_admin());

-- booking_status_history
CREATE POLICY "status_history_select" ON booking_status_history FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = booking_id
      AND (
        b.customer_id = auth.uid()
        OR EXISTS (SELECT 1 FROM providers p WHERE p.id = b.provider_id AND p.user_id = auth.uid())
        OR is_admin()
      )
  )
);
CREATE POLICY "status_history_admin" ON booking_status_history FOR ALL USING (is_admin());

-- reviews
CREATE POLICY "reviews_select" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON reviews FOR INSERT
  WITH CHECK (customer_id = auth.uid());
CREATE POLICY "reviews_admin" ON reviews FOR ALL USING (is_admin());

-- notifications
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "notifications_admin" ON notifications FOR ALL USING (is_admin());

-- audit_logs
CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT USING (is_admin());
CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT
  WITH CHECK (is_admin() AND admin_id = auth.uid());

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_profiles_user ON profiles(user_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_services_category ON services(category_id);
CREATE INDEX idx_providers_user ON providers(user_id);
CREATE INDEX idx_providers_active ON providers(is_active, is_verified);
CREATE INDEX idx_provider_services_service ON provider_services(service_id);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_provider ON bookings(provider_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_booking_status_history_booking ON booking_status_history(booking_id);
CREATE INDEX idx_reviews_provider ON reviews(provider_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, read_at);
CREATE INDEX idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
