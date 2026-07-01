-- Nexo seed data — run after supabase/schema.sql

INSERT INTO service_categories (name, slug, description, icon, sort_order) VALUES
  ('Home Cleaning', 'cleaning', 'Professional home cleaning for HDB, condo and landed homes', '🧹', 1),
  ('Handyman', 'handyman', 'Repairs, installations and general handyman services', '🔧', 2),
  ('Movers', 'movers', 'Reliable moving and relocation services across Singapore', '📦', 3),
  ('Aircon Service', 'aircon', 'Aircon servicing, chemical wash, repair and installation', '❄️', 4),
  ('Plumbing', 'plumbing', 'Plumbing repairs, leak fixes and pipe installations', '🚿', 5)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO services (category_id, name, slug, description, base_price, sort_order)
SELECT id,
  CASE slug
    WHEN 'cleaning' THEN 'Standard Home Cleaning'
    WHEN 'handyman' THEN 'General Handyman Visit'
    WHEN 'movers' THEN 'Local Move (1-bedroom)'
    WHEN 'aircon' THEN 'Aircon General Service'
    WHEN 'plumbing' THEN 'Plumbing Inspection & Repair'
  END,
  slug || '-standard',
  description,
  CASE slug
    WHEN 'cleaning' THEN 45
    WHEN 'handyman' THEN 60
    WHEN 'movers' THEN 120
    WHEN 'aircon' THEN 55
    WHEN 'plumbing' THEN 65
  END,
  sort_order
FROM service_categories
ON CONFLICT (category_id, slug) DO NOTHING;

-- Demo providers with locations, prices, and a sample customer:
-- Run supabase/seed-demo.sql after this file.
