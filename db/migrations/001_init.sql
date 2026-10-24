CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS material_versions (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL DEFAULT '',
  released_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO material_versions (id, description)
VALUES ('flow-v1', '流程文件第一版：八组固定材料、15 题问卷')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS admin_users (
  username TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS participant_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE,
  assignment_group_id SMALLINT NOT NULL CHECK (assignment_group_id BETWEEN 1 AND 8),
  remind SMALLINT NOT NULL CHECK (remind IN (0, 1)),
  scope SMALLINT NOT NULL CHECK (scope IN (1, 2)),
  goods SMALLINT NOT NULL CHECK (goods IN (1, 2)),
  collection_phase TEXT NOT NULL CHECK (collection_phase IN ('dev', 'pilot', 'formal')),
  current_step TEXT NOT NULL,
  preview_group SMALLINT,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_participant_sessions_token_hash
  ON participant_sessions (token_hash);

CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id TEXT NOT NULL UNIQUE,
  session_id UUID NOT NULL UNIQUE REFERENCES participant_sessions(id),
  group_id SMALLINT NOT NULL CHECK (group_id BETWEEN 1 AND 8),
  remind SMALLINT NOT NULL CHECK (remind IN (0, 1)),
  scope SMALLINT NOT NULL CHECK (scope IN (1, 2)),
  goods SMALLINT NOT NULL CHECK (goods IN (1, 2)),
  permission_page_shown BOOLEAN NOT NULL,
  material_version TEXT NOT NULL REFERENCES material_versions(id),
  questionnaire_version TEXT NOT NULL,
  collection_phase TEXT NOT NULL CHECK (collection_phase IN ('dev', 'pilot', 'formal')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_active_ms BIGINT NOT NULL DEFAULT 0,
  consent_active_ms BIGINT,
  history_active_ms BIGINT,
  permission_active_ms BIGINT,
  task_active_ms BIGINT,
  recommendation_active_ms BIGINT,
  questionnaire_active_ms BIGINT,
  page_visits JSONB NOT NULL DEFAULT '[]'::jsonb,
  quality_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  q01 SMALLINT NOT NULL CHECK (q01 BETWEEN 1 AND 5),
  q02 SMALLINT NOT NULL CHECK (q02 BETWEEN 1 AND 5),
  q03 SMALLINT NOT NULL CHECK (q03 BETWEEN 1 AND 5),
  q04 SMALLINT NOT NULL CHECK (q04 BETWEEN 1 AND 5),
  q05 SMALLINT NOT NULL CHECK (q05 BETWEEN 1 AND 5),
  q06 SMALLINT NOT NULL CHECK (q06 BETWEEN 1 AND 5),
  q07 SMALLINT NOT NULL CHECK (q07 BETWEEN 1 AND 5),
  q08 SMALLINT NOT NULL CHECK (q08 BETWEEN 1 AND 5),
  q09 SMALLINT NOT NULL CHECK (q09 BETWEEN 1 AND 5),
  q10 SMALLINT NOT NULL CHECK (q10 BETWEEN 1 AND 5),
  q11 SMALLINT NOT NULL CHECK (q11 BETWEEN 1 AND 5),
  q12 SMALLINT NOT NULL CHECK (q12 BETWEEN 1 AND 5),
  q13 SMALLINT NOT NULL CHECK (q13 BETWEEN 1 AND 5),
  q14 SMALLINT NOT NULL CHECK (q14 BETWEEN 1 AND 5),
  q15 SMALLINT NOT NULL CHECK (q15 BETWEEN 1 AND 5)
);

CREATE INDEX IF NOT EXISTS idx_submissions_phase
  ON submissions (collection_phase);
CREATE INDEX IF NOT EXISTS idx_submissions_group
  ON submissions (group_id);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at
  ON submissions (submitted_at DESC);
