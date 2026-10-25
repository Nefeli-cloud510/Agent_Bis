INSERT INTO material_versions (id, description)
VALUES (
  'flow-v2',
  '流程修订版：八组统一进入权限告知页；scope 控制权限页内容，remind 仅控制推荐页顶部提示'
)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'submissions_flow_v2_permission_shown_check'
  ) THEN
    ALTER TABLE submissions
      ADD CONSTRAINT submissions_flow_v2_permission_shown_check
      CHECK (material_version <> 'flow-v2' OR permission_page_shown = true);
  END IF;
END $$;
