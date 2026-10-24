import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const DATABASE_URL = process.env.DATABASE_URL ?? 'postgres://postgres:postgres@127.0.0.1:55432/d_demo';
const pool = new pg.Pool({ connectionString: DATABASE_URL, max: 2 });

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const migrationsDir = path.resolve(process.cwd(), 'db', 'migrations');
    const files = fs.readdirSync(migrationsDir).filter((file) => file.endsWith('.sql')).sort();
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await client.query(sql);
      console.log('migrated', file);
    }

    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;
    if (username && password) {
      const passwordHash = await bcrypt.hash(password, 12);
      await client.query(
        `INSERT INTO admin_users (username, password_hash)
         VALUES ($1, $2)
         ON CONFLICT (username) DO UPDATE
           SET password_hash = EXCLUDED.password_hash, updated_at = now()`,
        [username, passwordHash]
      );
      console.log('admin user upserted:', username);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error('migration failed:', error.stack || error.message || error);
  process.exit(1);
});
