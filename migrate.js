const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL
  });

  try {
    await client.connect();
    console.log("Connected to DB!");

    await client.query(`
      CREATE TABLE IF NOT EXISTS "user_addresses" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "fullName" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "province" TEXT NOT NULL,
        "commune" TEXT NOT NULL,
        "detail" TEXT NOT NULL,
        "isDefault" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "user_addresses_pkey" PRIMARY KEY ("id")
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "product_reviews" (
        "id" TEXT NOT NULL,
        "productId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "rating" INTEGER NOT NULL DEFAULT 5,
        "content" TEXT,
        "imagesUrl" TEXT[],
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "product_reviews_pkey" PRIMARY KEY ("id")
      );
    `);

    console.log("Tables created!");

    // Check foreign keys separately so it doesn't fail if they already exist
    try {
      await client.query(`
        ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `);
      console.log("FK user_addresses_userId added");
    } catch (e) {
      console.log("FK user_addresses_userId might already exist:", e.message);
    }

    try {
      await client.query(`
        ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `);
      console.log("FK product_reviews_productId added");
    } catch (e) {
      console.log("FK product_reviews_productId might already exist:", e.message);
    }

    try {
      await client.query(`
        ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `);
      console.log("FK product_reviews_userId added");
    } catch (e) {
      console.log("FK product_reviews_userId might already exist:", e.message);
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

run();
