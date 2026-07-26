import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config();
}

const prisma = new PrismaClient();

async function main() {
  console.log("Checking siteSettings:");
  const settings = await prisma.siteSetting.findMany();
  console.log(settings);

  console.log("\nChecking Navigation/Menu (this was fetched from old API):");
  // Oh, wait, the old web fetched from `https://api.nongduocmiennam.vn:5056/api/...`
}
main().catch(console.error).finally(() => prisma.$disconnect());
