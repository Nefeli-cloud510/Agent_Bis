import { Pool } from "pg";
import { getDatabaseUrl } from "./env";

const globalForDb = globalThis as unknown as { __pgPool?: Pool };

export function getPool(): Pool {
  globalForDb.__pgPool ??= new Pool({
    connectionString: getDatabaseUrl(),
    max: 10,
    idleTimeoutMillis: 30_000,
  });
  return globalForDb.__pgPool;
}
