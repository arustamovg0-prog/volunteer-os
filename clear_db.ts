import pg from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres?schema=public";
const pool = new pg.Pool({ connectionString });

async function main() {
  await pool.query('DELETE FROM mock_messages;');
  await pool.query('DELETE FROM chat_messages;');
  console.log('Cleared mockMessages and chatMessages');
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
