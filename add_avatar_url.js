const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;`);
    console.log("Added avatarUrl column successfully!");
  } catch (error) {
    console.error("Error adding avatarUrl column:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
