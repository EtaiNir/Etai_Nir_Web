-- supabase/migrations/001_core_tables.sql

-- ── Councils ────────────────────────────────────────────────────
CREATE TABLE councils (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL UNIQUE,     -- 'mata_yehuda'
  display_name  text NOT NULL,            -- 'מטה יהודה'
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

-- ── Users (extends Supabase auth.users) ─────────────────────────
CREATE TABLE users (
  id            uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  council_id    uuid NOT NULL REFERENCES councils(id),
  role          text NOT NULL DEFAULT 'viewer'
                  CHECK (role IN ('viewer', 'admin', 'super_admin')),
  display_name  text,
  created_at    timestamptz DEFAULT now()
);

-- Trigger: auto-create user row when auth.users row is created
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO users (id, council_id, role)
  VALUES (NEW.id,
          (NEW.raw_user_meta_data->>'council_id')::uuid,
          COALESCE(NEW.raw_user_meta_data->>'role', 'viewer'));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- ── RLS: councils ────────────────────────────────────────────────
ALTER TABLE councils ENABLE ROW LEVEL SECURITY;
CREATE POLICY "councils_read_all" ON councils
  FOR SELECT USING (true);  -- all authenticated users can read council names

-- ── RLS: users ──────────────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_council" ON users
  FOR SELECT USING (
    council_id = (SELECT council_id FROM users WHERE id = auth.uid())
  );
