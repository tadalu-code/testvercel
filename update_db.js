const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Add columns to orders
    await prisma.$executeRawUnsafe(`ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "couponCode" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;`);
    
    console.log("Added columns to orders");

    // Create coupons table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "public"."coupons" (
          "id" TEXT NOT NULL,
          "code" TEXT NOT NULL,
          "discountType" TEXT NOT NULL,
          "discountValue" DOUBLE PRECISION NOT NULL,
          "minOrderValue" DOUBLE PRECISION,
          "maxDiscountAmount" DOUBLE PRECISION,
          "usageLimit" INTEGER,
          "usedCount" INTEGER NOT NULL DEFAULT 0,
          "startDate" TIMESTAMP(3),
          "endDate" TIMESTAMP(3),
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
      );
    `);

    // Create unique index on code
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "coupons_code_key" ON "public"."coupons"("code");
    `);

    console.log("Created coupons table");
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
