const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();
  try {
    await client.query('ALTER TABLE user_addresses DROP CONSTRAINT IF EXISTS "user_addresses_userId_fkey";');
    await client.query('ALTER TABLE product_reviews DROP CONSTRAINT IF EXISTS "product_reviews_userId_fkey";');
    console.log("Dropped FK constraints!");
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

run();
