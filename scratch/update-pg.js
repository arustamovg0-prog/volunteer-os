const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://neondb_owner:npg_Twqj2QNPI9cu@ep-patient-darkness-asmpdq10-pooler.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require",
  });
  
  await client.connect();
  
  const token = '8984401269:AAG0A9Y2loEjkKii-h9-Ko1GfgHioP4Gsno';
  const url = 'https://volunteer-633owy12e-arustamovg0-progs-projects.vercel.app/';
  
  // Check if exists
  const res = await client.query('SELECT id FROM "BotConfig" LIMIT 1');
  if (res.rows.length > 0) {
    await client.query('UPDATE "BotConfig" SET bot_token = $1, webhook_url = $2 WHERE id = $3', [token, url, res.rows[0].id]);
    console.log('Updated BotConfig');
  } else {
    await client.query('INSERT INTO "BotConfig" (id, bot_token, webhook_url, is_simulator_enabled) VALUES (1, $1, $2, true)', [token, url]);
    console.log('Inserted BotConfig');
  }
  
  const updated = await client.query('SELECT * FROM "BotConfig"');
  console.log(updated.rows);
  
  await client.end();
}

main().catch(console.error);
