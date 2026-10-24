# 测试与验证记录

验证环境：Windows 本地、Node.js 22、pnpm 11、嵌入式 PostgreSQL 18.4（端口 55432）、Chrome。

## 静态检查与单元测试

| 项目 | 命令 | 结果 |
| --- | --- | --- |
| TypeScript | `pnpm typecheck` | 通过 |
| ESLint | `pnpm lint` | 通过 |
| 单元测试 | `pnpm test` | 6 个文件、23 个用例全部通过 |

单元测试覆盖：八组映射、材料与 15 题原文、5 点答案校验、CSV 转义、质量标记和逐题统计。

## E2E

命令：

```powershell
$env:PLAYWRIGHT_CHANNEL = "chrome"
pnpm test:e2e
```

结果：17 个用例全部通过。

覆盖范围：

- 未登录不能查看后台或导出；
- 无会话不能直接访问权限页或问卷页；
- 无提醒组无法通过 URL 看到权限页，刷新不换位置；
- 同意接口幂等，相同键只创建一个会话；
- 连续提交和超时重试只落一条数据；
- 断网不显示虚假成功，恢复后重试成功；
- 主动退出不产生样本并清除服务端会话；
- 管理员登录后可导出带 UTF-8 BOM 的 CSV；
- 组 1-8 的页面分支、权限文案、任务文案、推荐提醒、三款商品和提交参数全部正确；
- 375px 手机视口完整完成有提醒、电脑包组流程，且无横向溢出。

## 生产构建

验证了在未设置 `DATABASE_URL` 的环境下运行 `NODE_ENV=production pnpm build` 可以完成，证明正式构建不依赖数据库；数据库只在运行时 API 调用时惰性连接。

## Docker 部署配置

本机没有安装 Docker 命令，因此未在当前机器实际执行 `docker compose up`。`Dockerfile`、`docker-compose.yml`、迁移入口和备份脚本均已提供；部署到带 Docker 的服务器后，建议先执行一次 `docker compose up -d --build` 和一次备份恢复演练。
