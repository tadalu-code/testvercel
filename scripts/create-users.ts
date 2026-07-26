import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config();
}

const prisma = new PrismaClient();

async function createUsers() {
  console.log("Creating users...");

  // Tạo mật khẩu đã băm (hashed password)
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('Admin@123456', salt);
  const userPassword = await bcrypt.hash('User@123456', salt);

  // 1. Tạo tài khoản Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nongduoc.vn' },
    update: {
      password: adminPassword,
      role: 'admin',
      name: 'Quản Trị Viên',
    },
    create: {
      email: 'admin@nongduoc.vn',
      password: adminPassword,
      role: 'admin',
      name: 'Quản Trị Viên',
      username: 'admin',
    },
  });
  console.log(`✅ Đã tạo tài khoản Admin: ${admin.email}`);

  // 2. Tạo tài khoản User thường
  const user = await prisma.user.upsert({
    where: { email: 'user@nongduoc.vn' },
    update: {
      password: userPassword,
      role: 'user',
      name: 'Khách Hàng',
    },
    create: {
      email: 'user@nongduoc.vn',
      password: userPassword,
      role: 'user',
      name: 'Khách Hàng',
      username: 'user_khach',
    },
  });
  console.log(`✅ Đã tạo tài khoản User: ${user.email}`);

  console.log("Hoàn tất!");
}

createUsers()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
