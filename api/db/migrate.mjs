import fs from 'node:fs';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const devVarsPath = path.resolve(process.cwd(), '.dev.vars');
  if (fs.existsSync(devVarsPath)) {
    const lines = fs.readFileSync(devVarsPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/);
      if (match) {
        return match[1].replace(/^['"]|['"]$/g, '');
      }
    }
  }
  return null;
}

async function main() {
  const dbUrl = loadDatabaseUrl();
  if (!dbUrl || dbUrl.includes('ep-your-neon-host')) {
    console.error('Error: Please set a valid Neon DATABASE_URL in .dev.vars or environment.');
    process.exit(1);
  }

  const sql = neon(dbUrl);
  const schemaSql = fs.readFileSync(path.resolve(process.cwd(), 'api/db/schema.sql'), 'utf8');
  const statements = schemaSql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`Running ${statements.length} SQL statements against Neon Postgres...`);
  for (const stmt of statements) {
    await sql.query(stmt);
  }
  console.log('Migration complete! All 9 tables and indexes are ready.');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
