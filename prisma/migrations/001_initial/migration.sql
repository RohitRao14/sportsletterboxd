-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Add search_vector column to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- GIN index on search_vector
CREATE INDEX IF NOT EXISTS events_search_vector_idx ON events USING GIN (search_vector);

-- Trigram index on event name
CREATE INDEX IF NOT EXISTS events_name_trgm_idx ON events USING GIN (name gin_trgm_ops);

-- Function to build the search vector
CREATE OR REPLACE FUNCTION events_search_vector_update() RETURNS TRIGGER AS $$
DECLARE
  participant_names TEXT;
BEGIN
  participant_names := COALESCE(
    array_to_string(
      ARRAY(SELECT jsonb_array_elements_text(NEW.sport_meta->'participantNames')),
      ' '
    ),
    ''
  );

  NEW.search_vector :=
    setweight(to_tsvector('english', unaccent(COALESCE(NEW.name, ''))), 'A') ||
    setweight(to_tsvector('english', unaccent(participant_names)), 'B') ||
    setweight(to_tsvector('english', unaccent(COALESCE(NEW.venue, '') || ' ' || COALESCE(NEW.city, ''))), 'C') ||
    setweight(to_tsvector('english', unaccent(COALESCE(NEW.season, '') || ' ' || COALESCE(NEW.country, ''))), 'D');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update search_vector
DROP TRIGGER IF EXISTS events_search_vector_trigger ON events;
CREATE TRIGGER events_search_vector_trigger
  BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION events_search_vector_update();

-- Backfill existing rows
UPDATE events SET search_vector = NULL WHERE search_vector IS NULL;
