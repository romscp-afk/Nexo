-- Nexo seed data — run after supabase/schema.sql

INSERT INTO service_categories (name, slug, description, icon, sort_order) VALUES
  ('Home Cleaning', 'cleaning', 'Professional home cleaning for HDB, condo and landed homes', '🧹', 1),
  ('Handyman', 'handyman', 'Repairs, installations and general handyman services', '🔧', 2),
  ('Movers', 'movers', 'Reliable moving and relocation services across Singapore', '📦', 3),
  ('Aircon Service', 'aircon', 'Aircon servicing, chemical wash, repair and installation', '❄️', 4),
  ('Plumbing', 'plumbing', 'Plumbing repairs, leak fixes and pipe installations', '🚿', 5);

INSERT INTO services (category_id, name, slug, description, base_price, sort_order)
SELECT id, 'Standard ' || name, slug || '-standard', description, 50, sort_order
FROM service_categories;

-- Demo providers: register via the app as provider, then admin verifies from /admin
