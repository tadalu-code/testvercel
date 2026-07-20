const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();
  try {
    await client.query(`
      ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "isCancelRequested" BOOLEAN NOT NULL DEFAULT false;
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS "cancel_reasons" (
        "id" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "cancel_reasons_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log("Database schema updated!");
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

run();
