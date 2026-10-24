ALTER TABLE participant_sessions
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_participant_sessions_idempotency_key
  ON participant_sessions (idempotency_key);

CREATE INDEX IF NOT EXISTS idx_submissions_session_id
  ON submissions (session_id);
