import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import WebSocket from 'ws';

(global as any).WebSocket = WebSocket;

// Load .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config();
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in environment");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const prisma = new PrismaClient();

async function migrateData() {
  console.log("🚀 Starting data migration from Supabase to MySQL...");

  try {
    // 1. Migrate Categories
    console.log("Migrating Categories...");
    const { data: categories, error: catErr } = await supabase.from('categories').select('*');
    if (catErr) throw catErr;

    for (const cat of categories || []) {
      await prisma.category.upsert({
        where: { id: cat.id },
        update: {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          createdAt: cat.createdAt ? new Date(cat.createdAt) : (cat.created_at ? new Date(cat.created_at) : new Date()),
          updatedAt: cat.updatedAt ? new Date(cat.updatedAt) : (cat.updated_at ? new Date(cat.updated_at) : new Date())
        },
        create: {
          id: String(cat.id),
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          createdAt: cat.createdAt ? new Date(cat.createdAt) : (cat.created_at ? new Date(cat.created_at) : new Date()),
          updatedAt: cat.updatedAt ? new Date(cat.updatedAt) : (cat.updated_at ? new Date(cat.updated_at) : new Date())
        }
      });
    }
    console.log(`✅ Migrated ${categories?.length || 0} categories.`);

    // 2. Migrate Products
    console.log("Migrating Products...");
    const { data: products, error: prodErr } = await supabase.from('products').select('*');
    if (prodErr) throw prodErr;

    for (const prod of products || []) {
      await prisma.product.upsert({
        where: { id: prod.id },
        update: {
          name: prod.name,
          slug: prod.slug,
          description: prod.description,
          imagesUrl: prod.imagesUrl || prod.images_url || [], // Assuming it's an array or json
          isPublished: prod.isPublished !== undefined ? prod.isPublished : prod.is_published,
          price: prod.price,
          salePrice: prod.salePrice || prod.sale_price,
          categoryId: prod.categoryId || prod.category_id,
          stock: prod.stock,
          unit: prod.unit,
          technicalSpecs: prod.technicalSpecs || prod.technical_specs,
          createdAt: prod.createdAt ? new Date(prod.createdAt) : (prod.created_at ? new Date(prod.created_at) : undefined),
          updatedAt: prod.updatedAt ? new Date(prod.updatedAt) : (prod.updated_at ? new Date(prod.updated_at) : undefined),
        },
        create: {
          id: prod.id,
          name: prod.name,
          slug: prod.slug,
          description: prod.description,
          imagesUrl: prod.imagesUrl || prod.images_url || [],
          isPublished: prod.isPublished !== undefined ? prod.isPublished : prod.is_published,
          price: prod.price,
          salePrice: prod.salePrice || prod.sale_price,
          categoryId: prod.categoryId || prod.category_id,
          stock: prod.stock,
          unit: prod.unit,
          technicalSpecs: prod.technicalSpecs || prod.technical_specs,
          createdAt: prod.createdAt ? new Date(prod.createdAt) : (prod.created_at ? new Date(prod.created_at) : undefined),
          updatedAt: prod.updatedAt ? new Date(prod.updatedAt) : (prod.updated_at ? new Date(prod.updated_at) : undefined),
        }
      });
    }
    console.log(`✅ Migrated ${products?.length || 0} products.`);

    // 3. Migrate Topics
    console.log("Migrating Topics...");
    const { data: topics, error: topErr } = await supabase.from('topics').select('*');
    if (topErr) throw topErr;

    for (const top of topics || []) {
      await prisma.topic.upsert({
        where: { id: top.id },
        update: {
          name: top.name,
          slug: top.slug,
          createdAt: top.createdAt ? new Date(top.createdAt) : (top.created_at ? new Date(top.created_at) : undefined),
        },
        create: {
          id: top.id,
          name: top.name,
          slug: top.slug,
          createdAt: top.createdAt ? new Date(top.createdAt) : (top.created_at ? new Date(top.created_at) : undefined),
        }
      });
    }
    console.log(`✅ Migrated ${topics?.length || 0} topics.`);

    // 4. Migrate Posts
    console.log("Migrating Posts...");
    const { data: posts, error: postErr } = await supabase.from('posts').select('*');
    if (postErr) throw postErr;

    for (const post of posts || []) {
      await prisma.post.upsert({
        where: { id: post.id },
        update: {
          title: post.title,
          slug: post.slug,
          thumbnail: post.thumbnail,
          content: post.content,
          shortDescription: post.shortDescription || post.short_description,
          isPublished: post.isPublished !== undefined ? post.isPublished : post.is_published,
          topicId: post.topicId || post.topic_id,
          createdAt: post.createdAt ? new Date(post.createdAt) : (post.created_at ? new Date(post.created_at) : undefined),
          updatedAt: post.updatedAt ? new Date(post.updatedAt) : (post.updated_at ? new Date(post.updated_at) : undefined),
        },
        create: {
          id: post.id,
          title: post.title,
          slug: post.slug,
          thumbnail: post.thumbnail,
          content: post.content,
          shortDescription: post.shortDescription || post.short_description,
          isPublished: post.isPublished !== undefined ? post.isPublished : post.is_published,
          topicId: post.topicId || post.topic_id,
          createdAt: post.createdAt ? new Date(post.createdAt) : (post.created_at ? new Date(post.created_at) : undefined),
          updatedAt: post.updatedAt ? new Date(post.updatedAt) : (post.updated_at ? new Date(post.updated_at) : undefined),
        }
      });
    }
    console.log(`✅ Migrated ${posts?.length || 0} posts.`);

    // 5. Migrate Coupons
    console.log("Migrating Coupons...");
    const { data: coupons, error: coupErr } = await supabase.from('coupons').select('*');
    if (coupErr) {
      console.warn("⚠️ Error fetching coupons (maybe table doesn't exist?):", coupErr.message);
    } else {
      for (const coupon of coupons || []) {
        await prisma.coupon.upsert({
          where: { code: coupon.code },
          update: {
            discountType: coupon.discountType || coupon.discount_type,
            discountValue: coupon.discountValue || coupon.discount_value,
            minOrderValue: coupon.minOrderValue || coupon.min_order_value,
            maxDiscountAmount: coupon.maxDiscountAmount || coupon.max_discount_amount,
            startDate: coupon.startDate ? new Date(coupon.startDate) : (coupon.start_date ? new Date(coupon.start_date) : null),
            endDate: coupon.endDate ? new Date(coupon.endDate) : (coupon.end_date ? new Date(coupon.end_date) : null),
            usageLimit: coupon.usageLimit || coupon.usage_limit,
            usageCount: coupon.usageCount || coupon.usage_count || coupon.usedCount || coupon.used_count || 0,
            isActive: coupon.isActive !== undefined ? coupon.isActive : coupon.is_active,
            createdAt: coupon.createdAt ? new Date(coupon.createdAt) : (coupon.created_at ? new Date(coupon.created_at) : undefined),
            updatedAt: coupon.updatedAt ? new Date(coupon.updatedAt) : (coupon.updated_at ? new Date(coupon.updated_at) : undefined),
          },
          create: {
            id: coupon.id,
            code: coupon.code,
            discountType: coupon.discountType || coupon.discount_type,
            discountValue: coupon.discountValue || coupon.discount_value,
            minOrderValue: coupon.minOrderValue || coupon.min_order_value,
            maxDiscountAmount: coupon.maxDiscountAmount || coupon.max_discount_amount,
            startDate: coupon.startDate ? new Date(coupon.startDate) : (coupon.start_date ? new Date(coupon.start_date) : null),
            endDate: coupon.endDate ? new Date(coupon.endDate) : (coupon.end_date ? new Date(coupon.end_date) : null),
            usageLimit: coupon.usageLimit || coupon.usage_limit,
            usageCount: coupon.usageCount || coupon.usage_count || coupon.usedCount || coupon.used_count || 0,
            isActive: coupon.isActive !== undefined ? coupon.isActive : coupon.is_active,
            createdAt: coupon.createdAt ? new Date(coupon.createdAt) : (coupon.created_at ? new Date(coupon.created_at) : undefined),
            updatedAt: coupon.updatedAt ? new Date(coupon.updatedAt) : (coupon.updated_at ? new Date(coupon.updated_at) : undefined),
          }
        });
      }
      console.log(`✅ Migrated ${coupons?.length || 0} coupons.`);
    }

    // 6. Migrate Site Settings
    console.log("Migrating Site Settings...");
    const { data: siteSettings, error: setErr } = await supabase.from('site_settings').select('*');
    if (setErr) {
      console.warn("⚠️ Error fetching site_settings:", setErr.message);
    } else {
      for (const setting of siteSettings || []) {
        await prisma.siteSetting.upsert({
          where: { key: setting.key },
          update: { value: setting.value },
          create: { key: setting.key, value: setting.value }
        });
      }
      console.log(`✅ Migrated ${siteSettings?.length || 0} site settings.`);
    }

    console.log("🎉 Data migration finished successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateData();
