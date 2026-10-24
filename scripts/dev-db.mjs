import path from 'node:path';
import { findWindowsPostgresBin, runInitdb, startPostgresAsRestrictedUser, waitForPort, ensureDatabases } from './lib/embedded-start.mjs';

const action = process.argv[2] ?? 'start';
const port = Number(process.env.DEV_DB_PORT ?? 55432);
const dataDir = path.resolve(process.cwd(), '.pgdata', 'devpg');

console.log('PostgreSQL binary:', findWindowsPostgresBin());
console.log(`Data dir: ${dataDir}`);
console.log(`Port: ${port}`);

if (action === 'start') {
  await runInitdb(dataDir, port);
  await startPostgresAsRestrictedUser(dataDir, port).catch((error) => {
    console.error('runas 启动失败：', error.message);
    process.exit(1);
  });
  await waitForPort(port);
  await ensureDatabases(port, ['d_demo']);
  console.log('本地开发数据库已启动（d_demo）。设置 DATABASE_URL=postgres://postgres:postgres@127.0.0.1:55432/d_demo');
} else if (action === 'stop') {
  console.log('请使用 scripts/stop-db.ps1 停止，参数 -Port 默认 55432');
} else {
  console.error('未知动作：', action);
  process.exit(1);
}
