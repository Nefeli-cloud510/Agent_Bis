# 购物智能体研究数据收集平台

本项目按《流程(1)(1).docx》实现一个可部署的购物智能体实验网站：受试者完成固定八组之一的模拟购物体验和 15 题问卷，服务端把正式提交写入 PostgreSQL，研究人员登录后台查看统计、样本详情并导出 CSV。

当前材料版本为 `flow-v1`，问卷版本为 `flow-15-v1`。所有页面文字、商品、按钮和问卷均从流程文件原文提取；不会接入真实大模型、不会读取真实聊天、不会跳转真实电商、不会发生真实付款。

## 功能摘要

- 严格固定八组，服务端等概率随机分流，匿名会话凭证由服务端生成和验证。
- 有提醒组流程：知情同意 → 历史记录 → 权限告知 → 购买任务 → 推荐结果 → 问卷 → 结束。
- 无提醒组流程：知情同意 → 历史记录 → 购买任务 → 推荐结果 → 问卷 → 结束；不渲染权限页。
- 刷新回到正确步骤，不能通过 URL 提前跳转；提交幂等，双击、断网重试只产生一条样本。
- 未提交答案与活动日志只存当前标签页的 `sessionStorage`，主动退出清除并删除服务端会话；不采集手机号、身份信息或设备指纹。
- 管理后台在 `/admin`，所有数据接口执行服务端鉴权；支持按阶段、版本、组别、remind、scope、goods 筛选。
- 导出原始数据、分组描述统计与变量说明三类 CSV，统一 UTF-8 BOM、正确转义、防电子表格公式注入。
- 开发测试、预实验、正式实验通过 `COLLECTION_PHASE` 区分；固定组预览仅管理员和开发模式可用。

## 技术栈

- Next.js 16.4.3（App Router）、TypeScript、React 19、Tailwind CSS 4
- PostgreSQL 16、`pg`
- `jose`（管理员 JWT）、`bcryptjs`、`zod`
- Vitest 单元测试、Playwright E2E
- pnpm 11，依赖版本已锁定在 `pnpm-lock.yaml`

## 本地运行

要求 Node.js 22+ 与 pnpm 11。本地数据库使用 `scripts/dev-db.mjs` 启动随项目安装的嵌入式 PostgreSQL，端口默认 `55432`。

PowerShell：

```powershell
pnpm install
pnpm db:start
$env:DATABASE_URL = "postgres://postgres:postgres@127.0.0.1:55432/d_demo"
$env:ADMIN_USERNAME = "admin"
$env:ADMIN_PASSWORD = "LocalDevAdmin!2026"
pnpm db:migrate
pnpm dev
```

然后访问 `http://localhost:3000/start`，管理后台在 `http://localhost:3000/admin`。本地默认收集阶段为 `dev`，固定组预览会在后台显示。

## 环境变量

| 变量 | 说明 |
| --- | --- |
| `DATABASE_URL` | PostgreSQL 连接串 |
| `APP_SECRET` | 管理员 JWT 密钥，生产必填，建议 `openssl rand -hex 32` |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | 迁移时写入 `admin_users`，生产使用强密码 |
| `COLLECTION_PHASE` | `dev` / `pilot` / `formal`，默认 `formal` |
| `ALLOW_GROUP_PREVIEW` | 生产保持 `false`；固定组预览仅管理员、开发模式 |
| `PUBLIC_SITE_URL` | 公开站点地址 |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` / `APP_PORT` | Docker Compose 使用 |

## Docker Compose 部署

```bash
cp .env.example .env
# 编辑 .env，填写 APP_SECRET、POSTGRES_PASSWORD、ADMIN_PASSWORD
docker compose up -d --build
```

应用容器启动前自动执行数据库迁移，PostgreSQL 数据保存在 `study_pgdata` 持久卷。默认端口 `3000`，可通过 `APP_PORT` 修改。域名与 HTTPS、备份恢复详见 [部署与备份](docs/deployment-and-backup.md)。

## 测试与验证

```powershell
pnpm typecheck
pnpm lint
pnpm test
$env:PLAYWRIGHT_CHANNEL = "chrome"
pnpm test:e2e
```

完整测试结果见 [验证记录](docs/verification.md)。

## 交付文档

- [材料对照表与版本](docs/material-mapping.md)
- [数据字典](docs/data-dictionary.md)
- [内部研究说明与统计边界](docs/research-notes.md)
- [部署、域名、HTTPS、备份与恢复](docs/deployment-and-backup.md)
- [测试与验证记录](docs/verification.md)
