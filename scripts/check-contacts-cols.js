const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();
  try {
    const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'contacts'");
    console.log("Contacts columns:", res.rows.map(r => r.column_name).join(", "));
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

run();
