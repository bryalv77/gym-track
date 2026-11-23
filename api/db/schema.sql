-- Fitlance Neon Postgres Schema (Serverless Postgres)
-- Tables for users, gyms, exercises, routines and tracking data

CREATE TABLE IF NOT EXISTS gyms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  coach_code TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  uid TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'coach', 'member')),
  gym_id TEXT REFERENCES gyms(id) ON DELETE SET NULL,
  coach_id TEXT REFERENCES users(uid) ON DELETE SET NULL,
  photo_data TEXT,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_gym_id ON users(gym_id);
CREATE INDEX IF NOT EXISTS idx_users_coach_id ON users(coach_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('strength', 'cardio', 'other')),
  description TEXT,
  image_url TEXT,
  video_url TEXT,
  met DOUBLE PRECISION,
  suggested_order INTEGER,
  metric_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS routines (
  id TEXT PRIMARY KEY,
  coach_id TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  name TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_routines_coach_id ON routines(coach_id);

CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  date_key TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  coach_id TEXT NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  routine_id TEXT,
  routine_name TEXT,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_assignments_date_key ON assignments(date_key);
CREATE INDEX IF NOT EXISTS idx_assignments_member_date ON assignments(member_id, date_key);
CREATE INDEX IF NOT EXISTS idx_assignments_routine_lookup ON assignments(date_key, routine_id, member_id);

CREATE TABLE IF NOT EXISTS completions (
  uid TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  date_key TEXT NOT NULL,
  task_id TEXT NOT NULL,
  completed_at BIGINT NOT NULL,
  PRIMARY KEY (uid, date_key, task_id)
);

CREATE INDEX IF NOT EXISTS idx_completions_uid ON completions(uid);

CREATE TABLE IF NOT EXISTS measurements (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  date_key TEXT NOT NULL,
  weight_kg DOUBLE PRECISION,
  chest_cm DOUBLE PRECISION,
  waist_cm DOUBLE PRECISION,
  arm_cm DOUBLE PRECISION,
  thigh_cm DOUBLE PRECISION,
  notes TEXT,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_measurements_uid ON measurements(uid);

CREATE TABLE IF NOT EXISTS selfies (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  date_key TEXT NOT NULL,
  photo_data TEXT NOT NULL,
  notes TEXT,
  taken_at BIGINT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_selfies_uid ON selfies(uid);

CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at BIGINT NOT NULL
);

-- Plan codes a coach hands out so someone can use the app without an account.
-- A code unlocks one routine (read-only snapshot) and follows later edits to it.
CREATE TABLE IF NOT EXISTS share_codes (
  code TEXT PRIMARY KEY,
  coach_id TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  routine_id TEXT NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  created_at BIGINT NOT NULL,
  expires_at BIGINT,
  revoked BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_share_codes_coach_id ON share_codes(coach_id);
