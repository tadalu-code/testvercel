const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "likes" INTEGER NOT NULL DEFAULT 0;`);
    console.log("Added likes column successfully!");
  } catch (error) {
    console.error("Error adding likes column:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
