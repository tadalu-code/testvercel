const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();
  try {
    await client.query(`
      ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "technicalSpecs" TEXT;
    `);
    console.log("Added technicalSpecs to products table!");
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

run();
