-- Nexo seed data — run after 001_initial_schema.sql

-- Update admin email in nexo_admin_emails() function before signup, or edit here:
-- (Re-run the function definition with your email if needed)

-- Service categories
INSERT INTO service_categories (name, slug, description, icon, sort_order) VALUES
  ('Home Cleaning', 'cleaning', 'Professional home cleaning for HDB, condo and landed homes', '🧹', 1),
  ('Handyman', 'handyman', 'Repairs, installations and general handyman services', '🔧', 2),
  ('Movers', 'movers', 'Reliable moving and relocation services across Singapore', '📦', 3),
  ('Aircon Service', 'aircon', 'Aircon servicing, chemical wash, repair and installation', '❄️', 4),
  ('Plumbing', 'plumbing', 'Plumbing repairs, leak fixes and pipe installations', '🚿', 5);

-- Demo providers: register via the app as provider, then admin verifies from /admin/providers
