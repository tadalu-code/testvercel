import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding data...');

  // 1. Settings
  const settingsData = [
    { key: 'store_name', value: 'Nông Dược Miền Nam' },
    { key: 'contact_phone', value: '0123456789' },
    { key: 'contact_email', value: 'contact@nongduoc.vn' },
    { key: 'address', value: '123 Đường Nông Nghiệp, TP. HCM' },
  ];

  for (const s of settingsData) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }

  // 2. Categories
  const categories = [
    { name: 'Phân Bón', slug: 'phan-bon' },
    { name: 'Thuốc Bảo Vệ Thực Vật', slug: 'thuoc-bvtv' },
    { name: 'Hạt Giống', slug: 'hat-giong' },
    { name: 'Dụng Cụ Nông Nghiệp', slug: 'dung-cu' },
  ];

  const createdCategories = [];
  for (const c of categories) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
    createdCategories.push(cat);
  }

  // 3. Products
  const products = [
    {
      name: 'Phân bón NPK 20-20-15',
      slug: 'phan-bon-npk-20-20-15',
      price: 150000,
      description: 'Phân bón tổng hợp NPK 20-20-15 chất lượng cao, giúp cây trồng phát triển toàn diện.',
      categoryId: createdCategories[0].id,
      stock: 100,
      unit: 'Bao 50kg'
    },
    {
      name: 'Thuốc trừ sâu sinh học',
      slug: 'thuoc-tru-sau-sinh-hoc',
      price: 85000,
      description: 'Thuốc trừ sâu an toàn cho sức khỏe, thân thiện với môi trường.',
      categoryId: createdCategories[1].id,
      stock: 200,
      unit: 'Chai 500ml'
    },
    {
      name: 'Hạt giống Dưa Hấu Lai F1',
      slug: 'hat-giong-dua-hau-f1',
      price: 45000,
      description: 'Hạt giống dưa hấu siêu ngọt, năng suất cao, kháng bệnh tốt.',
      categoryId: createdCategories[2].id,
      stock: 500,
      unit: 'Gói 20g'
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }

  // 4. Topics
  const topics = [
    { name: 'Tin tức', slug: 'tin-tuc', description: 'Tin tức mới nhất về nông nghiệp' },
    { name: 'Kiến thức nhà nông', slug: 'kien-thuc', description: 'Chia sẻ kinh nghiệm canh tác hiệu quả' },
    { name: 'Khuyến mãi', slug: 'khuyen-mai', description: 'Các chương trình ưu đãi mới nhất' },
  ];

  const createdTopics = [];
  for (const t of topics) {
    const topic = await prisma.topic.upsert({
      where: { slug: t.slug },
      update: {},
      create: t,
    });
    createdTopics.push(topic);
  }

  // 5. Posts
  const posts = [
    {
      title: 'Cách sử dụng phân bón NPK hiệu quả',
      slug: 'cach-su-dung-phan-bon-npk-hieu-qua',
      content: '<p>Sử dụng phân bón NPK đúng cách giúp cây trồng sinh trưởng tốt và năng suất cao...</p>',
      shortDescription: 'Hướng dẫn chi tiết cách dùng phân bón NPK cho từng loại cây.',
      topicId: createdTopics[1].id,
    },
    {
      title: 'Khuyến mãi mùa màng Bội Thu giảm tới 20%',
      slug: 'khuyen-mai-mua-mang-boi-thu',
      content: '<p>Chương trình khuyến mãi đặc biệt giảm 20% cho tất cả các loại phân bón...</p>',
      shortDescription: 'Nhanh tay mua hàng để nhận ưu đãi hấp dẫn trong tháng này.',
      topicId: createdTopics[2].id,
    },
  ];

  for (const p of posts) {
    await prisma.post.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }

  // 6. Coupons
  const coupons = [
    {
      code: 'WELCOME10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      usageLimit: 100,
      isActive: true,
    },
    {
      code: 'GIAM50K',
      discountType: 'FIXED',
      discountValue: 50000,
      minOrderValue: 200000,
      usageLimit: 50,
      isActive: true,
    }
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
