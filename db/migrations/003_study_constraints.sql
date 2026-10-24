CREATE TABLE IF NOT EXISTS questionnaire_versions (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL DEFAULT '',
  released_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO questionnaire_versions (id, description)
VALUES ('flow-15-v1', '流程文件第一版：15 题、5 点同意度')
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'submissions_questionnaire_version_fkey'
  ) THEN
    ALTER TABLE submissions
      ADD CONSTRAINT submissions_questionnaire_version_fkey
      FOREIGN KEY (questionnaire_version)
      REFERENCES questionnaire_versions(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'submissions_group_parameters_check'
  ) THEN
    ALTER TABLE submissions
      ADD CONSTRAINT submissions_group_parameters_check
      CHECK (
        (group_id = 1 AND remind = 1 AND scope = 1 AND goods = 1) OR
        (group_id = 2 AND remind = 1 AND scope = 1 AND goods = 2) OR
        (group_id = 3 AND remind = 1 AND scope = 2 AND goods = 1) OR
        (group_id = 4 AND remind = 1 AND scope = 2 AND goods = 2) OR
        (group_id = 5 AND remind = 0 AND scope = 1 AND goods = 1) OR
        (group_id = 6 AND remind = 0 AND scope = 1 AND goods = 2) OR
        (group_id = 7 AND remind = 0 AND scope = 2 AND goods = 1) OR
        (group_id = 8 AND remind = 0 AND scope = 2 AND goods = 2)
      );
  END IF;
END $$;
