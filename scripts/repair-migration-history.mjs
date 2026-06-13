import { execSync } from 'child_process';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });

try {
  const { rows } = await pool.query(`
    SELECT migration_name
    FROM "_prisma_migrations"
    WHERE finished_at IS NULL AND rolled_back_at IS NULL
  `);

  if (rows.length === 0) {
    console.log('[db] No failed migrations in history.');
  }

  for (const { migration_name } of rows) {
    console.log(`[db] Marking rolled back: ${migration_name}`);
    execSync(`npx prisma migrate resolve --rolled-back ${migration_name}`, { stdio: 'inherit' });
  }

  console.log('[db] Running migrate deploy...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
} finally {
  await pool.end();
}
