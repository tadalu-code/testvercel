const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();
  try {
    const res = await client.query('SELECT * FROM "product_reviews"');
    console.log(res.rows);
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

run();
