INSERT INTO material_versions (id, description)
VALUES (
  'flow-v3',
  '对话式界面：推荐页改为固定购物助手对话；八组统一经过权限告知页；scope 控制权限页内容，remind 仅控制推荐回复中的提醒文案'
)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'submissions_flow_v3_permission_shown_check'
  ) THEN
    ALTER TABLE submissions
      ADD CONSTRAINT submissions_flow_v3_permission_shown_check
      CHECK (material_version <> 'flow-v3' OR permission_page_shown = true);
  END IF;
END $$;
