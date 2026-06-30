-- Nexo Marketplace — Initial Schema (11 core tables)
-- Run in Supabase SQL Editor or via supabase db push

-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('customer', 'provider', 'admin');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE notification_type AS ENUM ('booking', 'payment', 'review', 'system', 'admin');

-- Admin emails auto-promoted on signup (edit before first deploy)
CREATE OR REPLACE FUNCTION nexo_admin_emails()
RETURNS TEXT[] AS $$
  SELECT ARRAY['admin@nexo.sg']::TEXT[];
$$ LANGUAGE sql IMMUTABLE;

-- ─── 1. users ────────────────────────────────────────────────────────────────

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'customer',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 2. profiles ─────────────────────────────────────────────────────────────

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 3. service_categories ───────────────────────────────────────────────────

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

-- ─── 4. service_providers ────────────────────────────────────────────────────

CREATE TABLE service_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
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
  provider_id UUID NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  price_from NUMERIC(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  UNIQUE (provider_id, category_id)
);

-- ─── 6. bookings ─────────────────────────────────────────────────────────────

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
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
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 8. payments ─────────────────────────────────────────────────────────────

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SGD',
  status payment_status NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  transaction_ref TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 9. reviews ──────────────────────────────────────────────────────────────

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 10. notifications ───────────────────────────────────────────────────────

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type notification_type NOT NULL DEFAULT 'system',
  read_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 11. admin_logs ──────────────────────────────────────────────────────────

CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER service_providers_updated_at
  BEFORE UPDATE ON service_providers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

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

-- ─── Trigger: auto-create pending payment on booking ─────────────────────────

CREATE OR REPLACE FUNCTION create_booking_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_price IS NOT NULL AND NEW.total_price > 0 THEN
    INSERT INTO payments (booking_id, amount, currency, status)
    VALUES (NEW.id, NEW.total_price, 'SGD', 'pending');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER bookings_create_payment
  AFTER INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION create_booking_payment();

-- ─── Trigger: signup → users + profiles (+ service_providers) ────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role user_role;
  meta_role TEXT;
  new_user_id UUID;
BEGIN
  meta_role := NEW.raw_user_meta_data->>'role';

  IF NEW.email = ANY(nexo_admin_emails()) THEN
    assigned_role := 'admin';
  ELSIF meta_role IN ('customer', 'provider', 'admin') THEN
    assigned_role := meta_role::user_role;
  ELSE
    assigned_role := 'customer';
  END IF;

  INSERT INTO users (id, email, role)
  VALUES (NEW.id, NEW.email, assigned_role)
  RETURNING id INTO new_user_id;

  INSERT INTO profiles (user_id, full_name, phone)
  VALUES (
    new_user_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone'
  );

  IF assigned_role = 'provider' THEN
    INSERT INTO service_providers (user_id, business_name)
    VALUES (
      new_user_id,
      COALESCE(NEW.raw_user_meta_data->>'business_name', NEW.raw_user_meta_data->>'full_name', 'My Business')
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Helpers ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_provider()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'provider');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION log_admin_action(
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
    RAISE EXCEPTION 'Only admins can write admin logs';
  END IF;
  INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_details)
  RETURNING id INTO log_id;
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY "users_select_public" ON users FOR SELECT USING (true);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_admin_all" ON users FOR ALL USING (is_admin());

-- profiles
CREATE POLICY "profiles_select_public" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL USING (is_admin());

-- service_categories
CREATE POLICY "categories_select" ON service_categories FOR SELECT
  USING (is_active = true OR is_admin());
CREATE POLICY "categories_admin" ON service_categories FOR ALL USING (is_admin());

-- service_providers
CREATE POLICY "providers_select" ON service_providers FOR SELECT
  USING (is_active = true OR user_id = auth.uid() OR is_admin());
CREATE POLICY "providers_update_own" ON service_providers FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "providers_insert_own" ON service_providers FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "providers_admin" ON service_providers FOR ALL USING (is_admin());

-- provider_services
CREATE POLICY "provider_services_select" ON provider_services FOR SELECT USING (true);
CREATE POLICY "provider_services_manage_own" ON provider_services FOR ALL USING (
  EXISTS (
    SELECT 1 FROM service_providers sp
    WHERE sp.id = provider_id AND sp.user_id = auth.uid()
  )
);
CREATE POLICY "provider_services_admin" ON provider_services FOR ALL USING (is_admin());

-- bookings
CREATE POLICY "bookings_select" ON bookings FOR SELECT USING (
  customer_id = auth.uid()
  OR EXISTS (SELECT 1 FROM service_providers sp WHERE sp.id = provider_id AND sp.user_id = auth.uid())
  OR is_admin()
);
CREATE POLICY "bookings_insert" ON bookings FOR INSERT
  WITH CHECK (customer_id = auth.uid());
CREATE POLICY "bookings_update" ON bookings FOR UPDATE USING (
  (customer_id = auth.uid() AND status IN ('pending'))
  OR EXISTS (SELECT 1 FROM service_providers sp WHERE sp.id = provider_id AND sp.user_id = auth.uid())
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
        OR EXISTS (SELECT 1 FROM service_providers sp WHERE sp.id = b.provider_id AND sp.user_id = auth.uid())
        OR is_admin()
      )
  )
);
CREATE POLICY "status_history_admin" ON booking_status_history FOR ALL USING (is_admin());

-- payments
CREATE POLICY "payments_select" ON payments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = booking_id
      AND (
        b.customer_id = auth.uid()
        OR EXISTS (SELECT 1 FROM service_providers sp WHERE sp.id = b.provider_id AND sp.user_id = auth.uid())
        OR is_admin()
      )
  )
);
CREATE POLICY "payments_admin" ON payments FOR ALL USING (is_admin());

-- reviews
CREATE POLICY "reviews_select" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON reviews FOR INSERT
  WITH CHECK (customer_id = auth.uid());

-- notifications
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "notifications_admin" ON notifications FOR ALL USING (is_admin());

-- admin_logs
CREATE POLICY "admin_logs_select" ON admin_logs FOR SELECT USING (is_admin());
CREATE POLICY "admin_logs_insert" ON admin_logs FOR INSERT
  WITH CHECK (is_admin() AND admin_id = auth.uid());

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_profiles_user ON profiles(user_id);
CREATE INDEX idx_service_providers_user ON service_providers(user_id);
CREATE INDEX idx_service_providers_active ON service_providers(is_active, is_verified);
CREATE INDEX idx_provider_services_category ON provider_services(category_id);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_provider ON bookings(provider_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_booking_status_history_booking ON booking_status_history(booking_id);
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_reviews_provider ON reviews(provider_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, read_at);
CREATE INDEX idx_admin_logs_admin ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_entity ON admin_logs(entity_type, entity_id);
