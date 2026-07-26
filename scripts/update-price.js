const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();
  try {
    const res = await client.query(`UPDATE products SET price = 50000, stock = 100 WHERE slug = 'xeng-lam-vuon-mini-luoi-rong-deli-dl580811'`);
    console.log("Updated rows:", res.rowCount);
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

run();
