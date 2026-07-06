const { Pool } = require('pg');

const connectionString = "postgresql://postgres.lzzermiyeodpizpdheal:Rustamov93...@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";
console.log("Testing connection to:", connectionString.replace(/:[^:@]+@/, ':****@'));

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 5000
});

pool.query('SELECT * FROM bot_config', (err, res) => {
  if (err) {
    console.error("Connection failed:", err.message);
  } else {
    console.log("Query successful! Rows:", res.rows);
  }
  pool.end();
});
