# 部署、域名、HTTPS、备份与恢复

## Docker Compose

项目提供 `Dockerfile`、`.dockerignore`、`docker-compose.yml` 和 `deploy/Caddyfile.example`。Compose 包含：

- `db`：PostgreSQL 16，数据写入命名持久卷 `study_pgdata`；
- `app`：Next.js 生产服务，启动前执行 `node scripts/migrate.mjs`，然后 `pnpm start`；
- `app` 的 `depends_on` 等待数据库健康检查通过；
- 应用容器内 `ALLOW_GROUP_PREVIEW=false`，固定组预览不暴露给正式受试者。

部署步骤：

```bash
cp .env.example .env
```

编辑 `.env`，至少修改：

```dotenv
DATABASE_URL=postgres://study_app:strong-password-without-url-special-chars@db:5432/study_data
POSTGRES_USER=study_app
POSTGRES_PASSWORD=strong-password-without-url-special-chars
POSTGRES_DB=study_data
APP_SECRET=<openssl rand -hex 32 的结果>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<强管理员密码>
COLLECTION_PHASE=formal
PUBLIC_SITE_URL=https://study.example.com
```

数据库用户、密码和库名需要保持一致；若密码含 `@ : /` 等特殊字符，先做 URL 百分号编码。然后：

```bash
docker compose up -d --build
docker compose ps
```

应用默认监听宿主机 `3000`。多实例横向扩容时，应只让一个实例执行迁移，或先运行 `docker compose run --rm app node scripts/migrate.mjs` 再扩容。

## 域名与 HTTPS

推荐使用 Caddy 作为反向代理和自动 HTTPS。把 `deploy/Caddyfile.example` 放到服务器：

```
study.example.com {
  encode gzip
  reverse_proxy app:3000
}
```

把域名解析到服务器公网 IP，开放 80 和 443，Caddy 会自动申请续期 Let's Encrypt 证书。若把 `APP_PORT` 改成其他端口，同步修改 `reverse_proxy` 的目标端口。

如果使用 Nginx，等价配置为：

```nginx
server {
  listen 443 ssl http2;
  server_name study.example.com;
  ssl_certificate     /etc/letsencrypt/live/study.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/study.example.com/privkey.pem;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## 备份

```bash
sh scripts/backup-docker.sh
```

脚本调用 `docker compose exec db pg_dump`，在 `backups/` 生成 `study_<时间戳>.sql.gz`。建议 cron 每日备份并同步到异地存储：

```cron
30 3 * * * cd /opt/study && sh scripts/backup-docker.sh
```

## 恢复

```bash
sh scripts/restore-docker.sh backups/study_20261024_030000.sql.gz
```

恢复会覆盖当前 `study_data` 数据库中与备份重叠的对象。正式环境下先停止应用写入，再执行恢复：

```bash
docker compose stop app
sh scripts/restore-docker.sh backups/study_20261024_030000.sql.gz
docker compose start app
```

## 安全与运维提醒

- `.env` 不进入版本库；生产不复用示例密码。
- 应用不写答案类日志，但不能保证托管平台基础设施日志不含请求元数据；不要用会截获请求体的日志平台。
- 数据库凭据只通过环境变量传给应用服务，不暴露给浏览器。
- 正式收集开始后，材料或问卷需要修改时新建版本，不修改 `flow-v1` / `flow-v2` / `flow-v3` 已收集记录的解释。
- 备份既要有卷快照，也要有 `pg_dump` 逻辑备份；定期做一次恢复演练。
