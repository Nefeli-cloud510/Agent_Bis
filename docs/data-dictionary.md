# 数据字典

正式提交只发生在服务端成功写入 `submissions` 之后。未提交答案、活动时间和页面日志只在浏览器 `sessionStorage` 暂存，主动退出或未提交时不会写入研究库。

## 数据库表

### `material_versions`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | text PK | 材料版本号，当前 `flow-v1` |
| `description` | text | 版本说明 |
| `released_at` | timestamptz | 入库时间 |

### `questionnaire_versions`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | text PK | 问卷版本号，当前 `flow-15-v1` |
| `description` | text | 版本说明 |
| `released_at` | timestamptz | 入库时间 |

### `admin_users`

保存管理员用户名与 bcrypt 哈希。账号由迁移脚本按环境变量写入，数据库连接信息不会发送到浏览器。

### `participant_sessions`

服务端匿名会话：只保存 `token_hash`、固定组、参数、当前步骤、收集阶段和幂等键，不保存答案。`idempotency_key` 唯一索引防止同意按钮并发创建多个会话。

### `submissions`

每行是一份正式提交的样本。`participant_id` 唯一、`session_id` 唯一，均有约束；`group_id` 与 `remind/scope/goods` 的组合受数据库检查约束。提交使用事务：写 `submissions` 与推进会话到 `done` 在同一事务内，网络重试或双击只会得到一条记录。

## 导出字段

原始数据 CSV 固定列序：

`participant_id, group_id, remind, scope, goods, permission_page_shown, material_version, questionnaire_version, collection_phase, submitted_at, total_active_ms, consent_active_ms, history_active_ms, permission_active_ms, task_active_ms, recommendation_active_ms, questionnaire_active_ms, page_visits, quality_flags, q01, q02, q03, q04, q05, q06, q07, q08, q09, q10, q11, q12, q13, q14, q15`

| 字段 | 编码 / 说明 |
| --- | --- |
| `participant_id` | 服务端生成的匿名编号，格式 `P-<session UUID>` |
| `group_id` | 1-8，固定映射见材料对照表 |
| `remind` | 0=无提醒，1=有提醒 |
| `scope` | 1=仅最近会话，2=全部会话 |
| `goods` | 1=笔记本电脑，2=电脑包 |
| `permission_page_shown` | `true`=提醒组显示权限页；无提醒组为 `false` |
| `material_version` / `questionnaire_version` | flow-v1 / flow-15-v1 |
| `collection_phase` | dev、pilot、formal |
| `submitted_at` | 服务端提交时间，ISO 8601 UTC |
| `total_active_ms` | 各页面活动时间之和 |
| `consent_active_ms` 等 | 页面可见且窗口聚焦的累计毫秒；隐藏或失焦暂停；属于过程摘要而非认真阅读时长 |
| `permission_active_ms` | 无提醒组为 `null`，配合 `permission_page_shown=false`，区分“未出现”和“出现但 0 毫秒” |
| `page_visits` | JSON 数组，页面、进入/离开时间、活动毫秒；最多 300 条 |
| `quality_flags` | JSON 数组，仅提示，不自动剔除 |
| `q01`-`q15` | 整数 1-5，1=非常不同意，2=不同意，3=中立，4=同意，5=非常同意 |

## 质量标记

| 标记 | 含义 |
| --- | --- |
| `activity_data_missing` | 提交未附活动时间 |
| `very_fast_submission` | 总活动时间低于 15 秒 |
| `extreme_total_duration` | 总活动时间超过 4 小时 |
| `permission_page_below_500ms` | 出现权限页但活动时间低于 500 毫秒 |
| `uniform_answers` | 15 题答案完全相同 |

标记不用于自动剔除或修改样本。

## 导出格式

- 三类导出都是服务器实时查询数据库生成：原始数据、分组描述统计、变量说明。
- CSV 使用 UTF-8 BOM、`CRLF` 行尾，中文、逗号、引号和换行按 RFC 4180 转义。
- 单元格以 `=、+、-、@、Tab、CR` 开头时前置单引号，防电子表格公式注入。
- 无样本时原始数据 CSV 仍有表头；后台页面显示真实空状态，不使用示例数据。
