const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();
  try {
    const resP = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'posts'");
    console.log("Posts columns:", resP.rows.map(r => r.column_name).join(", "));
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

run();
