# 静态界面演示版（GitHub Pages）

本目录是独立的静态演示页面，仅用于向老师展示界面和八组流程差异，**不承担真实数据收集**。

- 入口选择八组之一后，可完整体验：知情同意 → 历史记录 → 权限告知 → 购买任务 → AI 推荐 → 问卷 → 结束。
- `scope` 控制权限告知页文案；`remind` 只控制推荐回复中的提醒文案；`goods` 控制任务与三款商品。
- 推荐页采用固定对话式界面，任务文本自动预填，点击“发送”后出现助手回复和 A/B/C 商品。
- 问卷保留 15 题原文、题序和 5 点选项，并保留分节标题“使用体验 / 体验回顾 / 日常使用”。
- 提交按钮会模拟完成流程，但**不会写入数据库**；问卷答案只保存在当前浏览器会话中，刷新不会重新分组。
- 本页不包含管理后台、数据库导出或真实参与者分流，不应替代正式实验版本。

## 在 GitHub Pages 上发布

仓库已包含 `.github/workflows/pages-demo.yml`，推送 `main` 分支时会把本目录自动发布到 Pages：

1. 在仓库 Settings → Pages 中把 Source 设为 `GitHub Actions`。
2. 推送包含本目录和工作流文件的提交。
3. 演示地址形如：`https://<用户名>.github.io/Agent_Bis/`

本仓库已按步骤 1 完成 Source 切换，后续对 `demo/` 目录的提交会自动触发部署。

本地预览可直接用浏览器打开 `demo/index.html`，或运行：

```powershell
cd demo
& "C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" -m http.server 8080
```

访问 `http://localhost:8080`。

## 验证演示版

仓库提供浏览器自检脚本，需从仓库根目录启动静态服务并使用 Chrome：

```powershell
$env:PLAYWRIGHT_CHANNEL = "chrome"
node demo/scripts/verify-demo.mjs
```

脚本会检查八组入口、两种权限文案、两组提醒文案、聊天发送流程、问卷校验与完成页、刷新保持、直接访问完成页的重定向，以及手机端单列布局。最近一次验证见 `demo/docs/verification.md`。

## 与正式版的区别

| 功能 | 正式版（需要服务器 + PostgreSQL） | 本静态演示 |
| --- | --- | --- |
| 八组入口 | 服务端随机分流，参与者只见一组 | 研究者手动选择八组之一 |
| 会话与步进校验 | 服务端会话凭证 + 步骤校验 | 浏览器会话内临时模拟 |
| 问卷提交 | 写入 PostgreSQL，幂等保存 | 仅模拟成功，不落库 |
| 管理后台 / CSV 导出 | 可用 | 不提供 |
| 时间记录 / 质量标记 | 随提交入库 | 不提供 |

正式版的代码、数据库和部署方式不受本目录影响。
