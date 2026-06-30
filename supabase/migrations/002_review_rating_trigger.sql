-- Auto-update provider rating when a review is submitted

CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE service_providers SET
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
