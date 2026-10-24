import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from 'node:fs';
import pg from 'pg';

const execFileAsync = promisify(execFile);

export function findWindowsPostgresBin() {
  const virtualDir = path.join(
    'D:\\demo\\node_modules\\.pnpm',
    '@embedded-postgres+windows-x64@18.4.0-beta.17',
    'node_modules\\@embedded-postgres\\windows-x64\\native'
  );
  if (fs.existsSync(path.join(virtualDir, 'bin', 'postgres.exe'))) {
    return path.join(virtualDir, 'bin', 'postgres.exe');
  }
  const candidates = [
    'node_modules/@embedded-postgres/windows-x64/native/bin/postgres.exe',
    'node_modules/embedded-postgres/native/bin/postgres.exe',
  ];
  for (const candidate of candidates) {
    const full = path.resolve(process.cwd(), candidate);
    if (fs.existsSync(full)) return full;
  }
  throw new Error('未找到嵌入式 PostgreSQL 的 postgres.exe，请先执行 pnpm install');
}

export function findInitdbBin() {
  const postgresExe = findWindowsPostgresBin();
  return path.join(path.dirname(postgresExe), 'initdb.exe');
}

export async function runInitdb(dataDir) {
  const initdb = findInitdbBin();
  if (fs.existsSync(path.join(dataDir, 'PG_VERSION'))) return;
  fs.mkdirSync(dataDir, { recursive: true });
  const passwordFile = path.join(dataDir, 'pg-password.tmp');
  fs.writeFileSync(passwordFile, 'postgres\n', 'utf8');
  try {
    await execFileAsync(initdb, [
      '--pgdata=' + dataDir,
      '--auth=password',
      '--username=postgres',
      '--pwfile=' + passwordFile,
      '--locale=C',
      '--encoding=UTF8',
    ], { stdio: 'ignore' });
  } finally {
    try { fs.unlinkSync(passwordFile); } catch {}
  }
}

export function startPostgresAsRestrictedUser(dataDir, port) {
  const postgres = findWindowsPostgresBin();
  const command = `"${postgres}" -D ${dataDir} -p ${port} -c logging_collector=off`;
  return execFileAsync('runas.exe', ['/trustlevel:0x20000', command], { timeout: 15_000 });
}

export async function waitForPort(port, tries = 60) {
  let attempt = 0;
  while (attempt < tries) {
    try {
      const client = new pg.Client({
        host: '127.0.0.1',
        port,
        user: 'postgres',
        password: 'postgres',
        database: 'postgres',
      });
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
      return;
    } catch {
      attempt += 1;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error(`PostgreSQL 在 ${port} 端口等待就绪超时`);
}

export async function ensureDatabases(port, names) {
  const client = new pg.Client({
    host: '127.0.0.1',
    port,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
  });
  await client.connect();
  try {
    for (const name of names) {
      const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
      if (result.rowCount === 0) {
        await client.query('CREATE DATABASE ' + client.escapeIdentifier(name));
      }
    }
  } finally {
    await client.end();
  }
}
