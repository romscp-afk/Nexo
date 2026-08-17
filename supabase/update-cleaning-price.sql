-- Set standard home cleaning catalog rate to SGD 15/hr (Phase 1).
-- Safe to re-run.

UPDATE services
SET base_price = 15
WHERE slug = 'cleaning-standard';

UPDATE provider_services ps
SET price_from = 15
FROM services s
WHERE ps.service_id = s.id
  AND s.slug = 'cleaning-standard';
