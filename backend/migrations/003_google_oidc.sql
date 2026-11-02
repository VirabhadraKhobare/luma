ALTER TABLE users ADD COLUMN IF NOT EXISTS google_subject text;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_google_subject_idx ON users (google_subject) WHERE google_subject IS NOT NULL;
