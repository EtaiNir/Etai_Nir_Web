-- supabase/migrations/006_rashuyot_chinuch.sql
-- Reference table for education authorities (רשויות חינוך)
-- Used to scope per-user reshut permissions (allowed_reshuyot in user metadata)

CREATE TABLE IF NOT EXISTS rashuyot_chinuch (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  council_id  uuid NOT NULL REFERENCES councils(id),
  semel       text NOT NULL,
  shem        text NOT NULL,
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rashuyot_chinuch_council_idx ON rashuyot_chinuch(council_id);

-- RLS disabled — server enforces council_id filter (same pattern as other ref tables)
ALTER TABLE rashuyot_chinuch DISABLE ROW LEVEL SECURITY;
